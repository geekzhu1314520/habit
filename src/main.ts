import "./styles/app.css";
import { mount } from "./ui/app";
mount(document.querySelector<HTMLElement>("#app")!);

import { mountWalking, walkingEnabled } from "./features/walking";
import { watchDate } from "./ui/clock";
import { localToday } from "./domain/date";
const walkingHost = document.createElement("div");
document.querySelector("#app")!.append(walkingHost);
const enabled = walkingEnabled(import.meta.env.VITE_WALKING_ENABLED);
const refreshWalking = () => mountWalking(walkingHost, enabled);
refreshWalking();
if (enabled) {
  watchDate(localToday, refreshWalking);
  window.addEventListener("storage", refreshWalking);
}
