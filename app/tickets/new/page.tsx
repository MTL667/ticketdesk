import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { NewTicketClient } from "@/components/NewTicketClient";

export default async function NewTicketPage() {
  const session = await auth();

  if (!session) {
    redirect("/signin");
  }

  const clickupFormUrl = process.env.NEXT_PUBLIC_CLICKUP_FORM_URL;

  return (
    <NewTicketClient 
      session={session} 
      clickupFormUrl={clickupFormUrl} 
    />
  );
}
