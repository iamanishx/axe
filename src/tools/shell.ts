import { z } from "zod";
import { tool } from "ai";

export const shellTool = tool({
    description: "Execute a shell command in the terminal",
    inputSchema: z.object({
        command: z.string().describe("The shell command to execute"),
        cwd: z.string().optional().describe("Working directory for the command"),
    }),
    execute: async ({ command, cwd }) => {
        try {
            const proc = Bun.spawn(["sh", "-c", command], {
                cwd: cwd || process.cwd(),
                stdout: "pipe",
                stderr: "pipe",
            });

            const stdout = await new Response(proc.stdout).text();
            const stderr = await new Response(proc.stderr).text();
            const exitCode = await proc.exited;

            if (exitCode !== 0) {
                return `Command failed (exit code ${exitCode}):\n${stderr || stdout}`;
            }

            return stdout || "(no output)";
        } catch (error: any) {
            return `Error: ${error.message}`;
        }
    },
});
