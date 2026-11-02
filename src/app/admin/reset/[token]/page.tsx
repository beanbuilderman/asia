import { Suspense } from "react";
import { AuthShell } from "../../AuthShell";
import { ResetForm } from "./ResetForm";

export default function ResetPage(props: PageProps<"/admin/reset/[token]">) {
  return (
    <AuthShell title="Choose a new password">
      <Suspense fallback={null}>
        <Form params={props.params} />
      </Suspense>
    </AuthShell>
  );
}

async function Form({ params }: { params: PageProps<"/admin/reset/[token]">["params"] }) {
  const { token } = await params;
  return <ResetForm token={token} />;
}
