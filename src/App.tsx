import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import { useState } from "react";
import { processTranscript } from "./process";
import { createTicket } from "./integration";
import { Role, SummaryEntry, Ticket } from "./types";
import { formatCurrency } from "./util";

function App() {
  const [cards, setCards] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [roles, setRoles] = useState<Role[]>([
    { name: "Frontend engineer", hourlyRate: 5000 },
    { name: "Backend engineer", hourlyRate: 4000 },
    { name: "Designer", hourlyRate: 3000 },
  ]);
  const [summary, setSummary] = useState<SummaryEntry[]>([]);

  const {
    transcript,
    listening,
    resetTranscript,
    browserSupportsSpeechRecognition,
  } = useSpeechRecognition();

  if (!browserSupportsSpeechRecognition) {
    return <span>Browser doesn't support speech recognition.</span>;
  }

  const handleStart = () => {
    SpeechRecognition.startListening({
      continuous: true,
      language: "hu-HU",
    });
  };

  const handleStop = async () => {
    setLoading(true);

    SpeechRecognition.stopListening();

    const generatedTickets = await processTranscript(transcript, roles);

    const reducedTickets = generatedTickets.reduce((acc, curr) => {
      if (acc[curr.role]) {
        acc[curr.role].workHours += curr.expectedWorkHours;
      } else {
        acc[curr.role] = {
          workHours: curr.expectedWorkHours,
          hourlyRate: roles.find((role) => role.name === curr.role)
            ?.hourlyRate as number,
          role: curr.role,
        };
      }
      return acc;
    }, {} as { [key: string]: SummaryEntry });

    setSummary(Object.values(reducedTickets));
    setCards(generatedTickets);

    setLoading(false);
  };

  const handleConfirm = async () => {
    setLoading(true);

    resetTranscript();
    setCards([]);
    setConfirmed(true);

    const ticketPromises = cards.map((card) =>
      createTicket({
        title: card.title,
        description: card.description,
        expectedWorkHours: card.expectedWorkHours,
        seniority: card.seniority,
        role: card.role,
      })
    );

    await Promise.all(ticketPromises);

    setLoading(false);
  };

  return (
    <main className="container p-12">
      <p className="text-lg font-bold">Recording: {listening ? "on" : "off"}</p>
      <Button onClick={handleStart}>Start</Button>
      <Button onClick={handleStop}>Stop</Button>
      <Button onClick={resetTranscript}>Reset</Button>

      <RoleView roles={roles} onChange={setRoles} />

      {transcript && (
        <p className="my-4 font-medium text-base">
          Transcription: {transcript}
        </p>
      )}

      {loading && (
        <div className="flex flex-col justify-center items-center">
          <img
            width={50}
            height={50}
            src="https://i.gifer.com/ZKZg.gif"
            alt="loading"
          />
          <p className="my-4 font-medium text-base">Loading...</p>
        </div>
      )}

      <div className="flex flex-col gap-4 px-4 my-4">
        {cards.map((card, index) => (
          <Card key={index} card={card} />
        ))}
      </div>

      {cards.length > 0 && (
        <Button onClick={handleConfirm}>Confirm & Submit</Button>
      )}

      {confirmed && (
        <>
          <p className="my-4 font-bold text-lg text-green-600">
            Thank you for your submission!
          </p>

          <div>
            <p className="my-4 font-bold text-lg text-blue-800">
              Feature summary
            </p>

            <p className="font-bold">
              Project total:{" "}
              {formatCurrency(
                summary.reduce((acc, curr) => {
                  return acc + curr.hourlyRate * curr.workHours;
                }, 0)
              )}
            </p>

            <div className="flex flex-col gap-4 px-4 my-4">
              {summary.map((entry, index) => (
                <div
                  key={index}
                  className="flex flex-row gap-4 border border-gray-500 shadow-sm rounded-md p-2"
                >
                  <p className="text-sm">
                    <strong>Role:</strong> {entry.role}
                  </p>
                  <p className="text-sm">
                    <strong>Work hours:</strong> {entry.workHours}
                  </p>
                  <p className="text-sm">
                    <strong>Hourly rate:</strong>{" "}
                    {formatCurrency(entry.hourlyRate)}
                  </p>
                  <p className="text-sm">
                    <strong>Cost:</strong>{" "}
                    {formatCurrency(entry.workHours * entry.hourlyRate)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </main>
  );
}

function RoleView({
  roles,
  onChange,
}: {
  roles: { name: string; hourlyRate: number }[];
  onChange: (roles: { name: string; hourlyRate: number }[]) => void;
}) {
  return (
    <div className="flex flex-col gap-4 px-4 my-4">
      {roles.map((role, index) => (
        <div
          key={index}
          className="flex flex-row gap-4 border border-gray-500 shadow-sm rounded-md p-2"
        >
          <input
            type="text"
            value={role.name}
            onChange={(e) => {
              const newRoles = [...roles];
              newRoles[index].name = e.target.value;
              onChange(newRoles);
            }}
            className="border border-blue-900 rounded-lg p-2"
          />
          <input
            type="number"
            value={role.hourlyRate}
            onChange={(e) => {
              const newRoles = [...roles];
              newRoles[index].hourlyRate = Number(e.target.value);
              onChange(newRoles);
            }}
            className="border border-blue-900 rounded-lg p-2"
          />
        </div>
      ))}
    </div>
  );
}

function Card({ card }: { card: Ticket }) {
  return (
    <div className="bg-gray-100 p-4 rounded-lg shadow-lg">
      <h1 className="text-xl font-bold">{card.title}</h1>
      <p className="text-sm">
        <strong>Role:</strong> {card.role}
      </p>
      <p className="text-sm">
        <strong>Expected work hours:</strong> {card.expectedWorkHours}
      </p>
      <p className="text-sm">
        <strong>Seniority:</strong> {card.seniority}
      </p>
      <p className="text-sm">{card.description}</p>
    </div>
  );
}

function Button({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded m-2"
    >
      {children}
    </button>
  );
}

export default App;
