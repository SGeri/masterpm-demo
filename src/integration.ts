import { Ticket } from "./types";

const TRELLO_API_KEY = import.meta.env.VITE_TRELLO_API_KEY;
const TRELLO_API_TOKEN = import.meta.env.VITE_TRELLO_API_TOKEN;
const TRELLO_LIST_ID = import.meta.env.VITE_TRELLO_LIST_ID;

function formatTicketDescription({
  role,
  description,
  expectedWorkHours,
  seniority,
}: Ticket) {
  return `
  **Role: ** ${role}%0A
  **Expected work hours:** ${expectedWorkHours}%0A
  **Seniority:** ${seniority}%0A%0A
  **Description:** ${description}
  `;
}

export async function createTicket({
  description: desc,
  expectedWorkHours,
  role,
  seniority,
  title,
}: Ticket) {
  const description = formatTicketDescription({
    title,
    description: desc,
    expectedWorkHours,
    seniority,
    role,
  });

  const res = await fetch(
    `https://api.trello.com/1/cards?idList=${TRELLO_LIST_ID}&name=${title}&desc=${description}&key=${TRELLO_API_KEY}&token=${TRELLO_API_TOKEN}`,
    {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    }
  )
    .then((res) => res.text())
    .catch((err) => console.log(err));

  if (!res) return null;

  const response = JSON.parse(res);

  return response;
}
