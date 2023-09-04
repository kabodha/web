import { RootService } from "../machines/root";
import { useAppContext } from "./useAppContext";

export function useRootMachine(): RootService {
  return useAppContext().rootMachine;
}
