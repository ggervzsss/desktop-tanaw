import type { Camera } from "../../../types/enterprise";

export type CameraFormValues = {
  name: string;
  rtsp: string;
  zone: string;
};

export type CameraConfig = Camera["config"];
