import { promises as fs } from "fs";
import JSONFileWatcher from "./JSONFileWatcher";

async function main() {
  const targetFolder = "./watched_json_files";

  try {
    await fs.mkdir(targetFolder, { recursive: true });
    console.log(`Created/verified target folder: ${targetFolder}`);
  } catch (error: any) {
    console.error("Error creating target folder:", error.message);
    return;
  }

  const watcher = new JSONFileWatcher(targetFolder);

  const stateInterval = setInterval(() => {
    watcher.printCurrentState();
  }, 10000);

  process.on("SIGINT", () => {
    console.log("\nShutting down gracefully...");
    clearInterval(stateInterval);
    watcher.stop();
    process.exit(0);
  });

  console.log(
    "\nFile watcher is running. Try adding/modifying/removing JSON files in the watched folder."
  );
  console.log("Press Ctrl+C to stop.\n");
}

main().catch(console.error);
