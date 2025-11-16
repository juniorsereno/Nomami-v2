import { StackHandler } from "@stackframe/stack";
import { stackServerApp } from "../../../stack/server";
import { redirect } from "next/navigation";

export default async function Handler(props: unknown) {
  const user = await stackServerApp.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return <StackHandler fullPage app={stackServerApp} routeProps={props} />;
}
