import { redirect } from "next/navigation";

export default function Home() {
  // Redireciona o usuário automaticamente para a tela principal
  redirect("/patientlist");
}