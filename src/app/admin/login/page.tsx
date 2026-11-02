import { Suspense } from "react";
import { AuthShell } from "../AuthShell";
import { LoginForm } from "./LoginForm";

export default function LoginPage(props: PageProps<"/admin/login">) {
  return (
    <AuthShell title="Sign in">
      <Suspense fallback={null}>
        <Form searchParams={props.searchParams} />
      </Suspense>
    </AuthShell>
  );
}

async function Form({ searchParams }: { searchParams: PageProps<"/admin/login">["searchParams"] }) {
  const next = (await searchParams).next;
  return <LoginForm next={typeof next === "string" ? next : "/admin/"} />;
}
