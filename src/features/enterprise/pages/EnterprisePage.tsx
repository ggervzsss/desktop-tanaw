import EnterpriseApp, { type EnterpriseView } from "../components/EnterpriseApp";

type EnterprisePageProps = {
  view?: EnterpriseView;
};

export function EnterprisePage({ view = "cameras" }: EnterprisePageProps) {
  return <EnterpriseApp initialView={view} />;
}
