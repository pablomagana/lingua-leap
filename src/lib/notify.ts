import { toast } from "sonner";
import type { CefrLevel } from "./gamification";

export function notifyPromotion(promotedTo: CefrLevel | null | undefined) {
  if (!promotedTo) return;
  toast.success(`🎓 ¡Has subido a nivel ${promotedTo}!`, {
    description: "Tu inglés está mejorando. ¡A por más!",
    duration: 6000,
  });
}
