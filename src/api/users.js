import { useQuery } from "@tanstack/react-query";
import { fetchAllPages } from "@/api/fetchAll";

export function useAvailableDriverUsers() {
  return useQuery({
    queryKey: ["available-driver-users"],
    queryFn: () => fetchAllPages("/users?role=driver"),
  });
}

export function useAvailablePassengerUsers() {
  return useQuery({
    queryKey: ["available-passenger-users"],
    queryFn: () => fetchAllPages("/users?role=passenger"),
  });
}
