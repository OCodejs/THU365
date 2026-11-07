import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.ocodejs.thu365",
  appName: "THU365",
  webDir: "dist",
  ios: {
    contentInset: "automatic",
    backgroundColor: "#100d0e",
    preferredContentMode: "mobile",
  },
};

export default config;
