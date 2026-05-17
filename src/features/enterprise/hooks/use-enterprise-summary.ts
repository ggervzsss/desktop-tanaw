import { useQuery } from "@tanstack/react-query";
import { getEnterpriseSummary } from "../api/get-enterprise-summary";

export function useEnterpriseSummary() {
  return useQuery({
    queryKey: ["enterprise-summary"],
    queryFn: getEnterpriseSummary,
  });
}
