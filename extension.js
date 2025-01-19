const vscode = require("vscode");

// Function to create a team
async function createTeam() {
  const teamName = await vscode.window.showInputBox({
    prompt: "Enter the team name",
    ignoreFocusOut: true,
  });

  if (!teamName) {
    vscode.window.showErrorMessage("Team name is required!");
    return false;
  }

  const user = extensionContext.globalState.get("userToken");

  // Extract just the user ID from the user object
  const creatorId = user?.id || user?._id;

  if (!creatorId) {
    console.error("No user ID found!");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/teams", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name: teamName, creatorId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || "Failed to create team.";
      vscode.window.showErrorMessage(errorMessage);
      return false;
    }

    const data = await response.json();
    vscode.window.showInformationMessage(
      `Team "${teamName}" created successfully!`
    );
    return true;
  } catch (error) {
    console.error("Error creating team:", error);
    vscode.window.showErrorMessage("Failed to create team. Please try again.");
    return false;
  }
}

// Function to add a member to a team
async function addTeamMember() {
  const teamName = await vscode.window.showInputBox({
    prompt: "Enter the team name",
    ignoreFocusOut: true,
  });

  if (!teamName) {
    vscode.window.showErrorMessage("Team name is required!");
    return false;
  }

  const username = await vscode.window.showInputBox({
    prompt: "Enter the username of the member to add",
    ignoreFocusOut: true,
  });

  if (!username) {
    vscode.window.showErrorMessage("Username is required!");
    return false;
  }

  const user = extensionContext.globalState.get("userToken");

  // Extract just the user ID from the user object
  const userId = user?.id || user?._id;

  if (!userId) {
    console.error("No user ID found!");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/teams/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ teamName, username, userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || "Failed to add member to team.";
      vscode.window.showErrorMessage(errorMessage);
      return false;
    }

    const data = await response.json();
    vscode.window.showInformationMessage(
      `User "${username}" added to team "${teamName}"!`
    );
    return true;
  } catch (error) {
    console.error("Error adding member to team:", error);
    vscode.window.showErrorMessage(
      "Failed to add member to team. Please try again."
    );
    return false;
  }
}

// Function to remove a member from a team
async function removeTeamMember() {
  const teamName = await vscode.window.showInputBox({
    prompt: "Enter the team name",
    ignoreFocusOut: true,
  });

  if (!teamName) {
    vscode.window.showErrorMessage("Team name is required!");
    return false;
  }

  const username = await vscode.window.showInputBox({
    prompt: "Enter the username of the member to remove",
    ignoreFocusOut: true,
  });

  if (!username) {
    vscode.window.showErrorMessage("Username is required!");
    return false;
  }

  const user = extensionContext.globalState.get("userToken");

  // Extract just the user ID from the user object
  const userId = user?.id || user?._id;

  if (!userId) {
    console.error("No user ID found!");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/teams/remove", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ teamName, username, userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        errorData.message || "Failed to remove member from team.";
      vscode.window.showErrorMessage(errorMessage);
      return false;
    }

    const data = await response.json();
    vscode.window.showInformationMessage(
      `User "${username}" removed from team "${teamName}"!`
    );
    return true;
  } catch (error) {
    console.error("Error removing member from team:", error);
    vscode.window.showErrorMessage(
      "Failed to remove member from team. Please try again."
    );
    return false;
  }
}

async function fetchTeamDetails() {
  // Get the user object from globalState
  const user = extensionContext.globalState.get("userToken");

  // Extract just the user ID from the user object
  const userId = user?.id || user?._id;

  if (!userId) {
    vscode.window.showErrorMessage("User ID not found. Please log in again.");
    return false;
  }

  try {
    // Changed to POST request with userId in body
    const response = await fetch("http://localhost:5000/api/user-teams", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || "Failed to fetch teams.";
      vscode.window.showErrorMessage(errorMessage);
      return false;
    }

    const data = await response.json();
    const teams = data.teams;

    if (teams.length === 0) {
      vscode.window.showInformationMessage(
        "You are not a member of any teams."
      );
      return false;
    }

    // Format team details for better readability in the VSCode notification
    const teamDetails = teams
      .map(
        (team) => `
Team: ${team.name}
Members:
${team.members.map((member) => `- ${member.username} (${member.email})`).join("\n")}
`
      )
      .join("\n");

    // Display the formatted team details in a notification
    vscode.window.showInformationMessage(teamDetails);
    return teamDetails;
  } catch (error) {
    console.error("Error fetching user teams:", error);
    vscode.window.showErrorMessage("Failed to fetch teams. Please try again.");
    return null;
  }
}
async function registerUser() {
  const username = await vscode.window.showInputBox({
    prompt: "Enter your username",
    ignoreFocusOut: true,
  });

  if (!username) {
    vscode.window.showErrorMessage("Username is required!");
    return false;
  }

  const email = await vscode.window.showInputBox({
    prompt: "Enter your email",
    ignoreFocusOut: true,
  });

  if (!email) {
    vscode.window.showErrorMessage("Email is required!");
    return false;
  }

  const password = await vscode.window.showInputBox({
    prompt: "Enter your password",
    password: true,
    ignoreFocusOut: true,
  });

  if (!password) {
    vscode.window.showErrorMessage("Password is required!");
    return false;
  }

  try {
    const response = await fetch("http://localhost:5000/api/signup", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || "Registration failed.";
      vscode.window.showErrorMessage(errorMessage);
      return false;
    }

    const data = await response.json();
    const { token, user } = data;

    // Store the token
    await extensionContext.globalState.update("authToken", token);
    await extensionContext.globalState.update("userToken", user);

    vscode.window.showInformationMessage(
      `Welcome, ${username}! Registration successful.`
    );
    return true;
  } catch (error) {
    console.error("Error registering user:", error);
    vscode.window.showErrorMessage("Failed to register. Please try again.");
    return false;
  }
}

// Modify authenticateUser to first check if user wants to register
async function authenticateUser() {
  // First check if already authenticated
  const authToken = extensionContext.globalState.get("authToken");
  if (authToken) {
    try {
      // Verify the stored token
      const response = await fetch("http://localhost:5000/api/verify", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const { user } = await response.json();
        vscode.window.showInformationMessage(`Welcome back, ${user.username}!`);
        return true;
      }
      // If verification fails, clear stored token
      await extensionContext.globalState.update("authToken", undefined);
    } catch (error) {
      console.error("Error verifying token:", error);
    }
  }

  // Ask if user wants to register or login
  const choice = await vscode.window.showQuickPick(["Login", "Register"], {
    placeHolder: "Would you like to login or register?",
    ignoreFocusOut: true,
  });

  if (!choice) {
    return false;
  }

  if (choice === "Register") {
    return await registerUser();
  }

  const email = await vscode.window.showInputBox({
    prompt: "Enter your email",
    ignoreFocusOut: true,
  });

  if (!email) {
    vscode.window.showErrorMessage("Email is required!");
    return false;
  }

  const password = await vscode.window.showInputBox({
    prompt: "Enter your password",
    password: true,
    ignoreFocusOut: true,
  });

  if (!password) {
    vscode.window.showErrorMessage("Password is required!");
    return false;
  }

  try {
    const response = await fetch("http://localhost:5000/api/signin", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.message || "Authentication failed.";
      vscode.window.showErrorMessage(errorMessage);
      return false;
    }

    const data = await response.json();
    const { token, user } = data;

    // Store the token
    await extensionContext.globalState.update("authToken", token);
    await extensionContext.globalState.update("userToken", user);

    vscode.window.showInformationMessage(`Welcome back, ${user.username}!`);
    return true;
  } catch (error) {
    console.error("Error authenticating user:", error);
    vscode.window.showErrorMessage("Failed to authenticate. Please try again.");
    return false;
  }
}

// Add a logout function to clear stored token
async function logout() {
  await extensionContext.globalState.update("authToken", undefined);
  vscode.window.showInformationMessage("Logged out successfully");

  // Close all webview panels
  if (vscode.window.activeTextEditor) {
    await vscode.commands.executeCommand("workbench.action.closeAllEditors");
  }

  // Deactivate the extension
  vscode.commands.executeCommand("workbench.action.reloadWindow");
}

async function analyzeCodeFromEditor() {
  console.log("Analyzing code...");
  const { GeminiAnalyzer } = require("./geminiAnalyzer");

  const apiKey = "AIzaSyCjtabTcyu6JSm6ZeiTd_XAH1pG4XbHLgI"; // It's better to store this securely
  const geminiAnalyzer = new GeminiAnalyzer(apiKey);

  try {
    // Get the active text editor
    const editor = vscode.window.activeTextEditor;

    if (!editor) {
      vscode.window.showErrorMessage("No active editor found");
      return null; // Return null if no editor is found
    }

    // Extract the code from the editor
    const code = editor.document.getText();

    // Get the language of the current file
    const language = editor.document.languageId;

    // Log the code and language (for debugging purposes)
    console.log("Code:", code);
    console.log("Language:", language);

    // Analyze the code using GeminiAnalyzer
    const analysisResults = await geminiAnalyzer.analyzeCode(code, language);

    // Display results in the VSCode output window or UI
    console.log("Analysis Results:", analysisResults);

    // Show results in VSCode's output or as a message
    vscode.window.showInformationMessage(
      "Code analysis completed! Check the console for details."
    );


    return analysisResults; // Return the analysis results
  } catch (error) {
    console.error("Error analyzing code:", error);
    vscode.window.showErrorMessage(
      "Failed to analyze code. Check the console for errors."
    );
    return null; // Return null in case of an error
  }
}

class FlowStateWebview {
  constructor(context) {
    this.context = context;
    this.panel = null;
    this.updateInterval = null;
  }

  async fetchTeamDetails() {
    try {
      const user = this.context.globalState.get("userToken");
      const userId = user?.id || user?._id;

      if (!userId) {
        return null;
      }

      const response = await fetch("http://localhost:5000/api/user-teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data.teams;
    } catch (error) {
      console.error("Error fetching team details:", error);
      return null;
    }
  }

  createOrShowPanel(flowTracker) {
    const columnToShowIn = vscode.window.activeTextEditor
      ? vscode.window.activeTextEditor.viewColumn
      : undefined;

    if (this.panel) {
      this.panel.reveal(columnToShowIn);
      this.updateContent(flowTracker);
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      "flowStateMetrics",
      "Flow State Analytics",
      columnToShowIn || vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
      }
    );

    this.panel.onDidDispose(
      () => {
        this.panel = null;
        if (this.updateInterval) {
          clearInterval(this.updateInterval);
          this.updateInterval = null;
        }
      },
      null,
      this.context.subscriptions
    );

    this.updateContent(flowTracker);

    this.updateInterval = setInterval(() => {
      this.updateContent(flowTracker);
    }, 1000);

    this.panel.webview.onDidReceiveMessage(
      async (message) => {
        switch (message.command) {
          case "reset":
            try {
              await flowTracker.saveSessionToDatabase(flowTracker);
              flowTracker.reset();
              this.updateContent(flowTracker);
              vscode.window.showInformationMessage(
                "Flow metrics have been reset"
              );
            } catch (error) {
              console.error("Error resetting flow metrics:", error);
              vscode.window.showErrorMessage(
                "An error occurred while resetting flow metrics."
              );
            }
            break;
          case "logout":
            try {
              await logout();
              vscode.window.showInformationMessage("Logged out successfully");
            } catch (error) {
              console.error("Error logging out:", error);
              vscode.window.showErrorMessage(
                "An error occurred while logging out."
              );
            }
            break;
          case "createTeam":
            try {
              const success = await createTeam();
              if (success) {
                this.updateContent(flowTracker);
              }
            } catch (error) {
              console.error("Error creating team:", error);
              vscode.window.showErrorMessage(
                "An error occurred while creating the team."
              );
            }
            break;
          case "addTeamMember":
            try {
              const success = await addTeamMember();
              if (success) {
                this.updateContent(flowTracker);
              }
            } catch (error) {
              console.error("Error adding team member:", error);
              vscode.window.showErrorMessage(
                "An error occurred while adding the team member."
              );
            }
            break;
          case "removeTeamMember":
            try {
              const success = await removeTeamMember();
              if (success) {
                this.updateContent(flowTracker);
              }
            } catch (error) {
              console.error("Error removing team member:", error);
              vscode.window.showErrorMessage(
                "An error occurred while removing the team member."
              );
            }
            break;
          case "viewTeam":
            try {
              await fetchTeamDetails();
            } catch (error) {
              console.error("Error viewing team details:", error);
              vscode.window.showErrorMessage(
                "An error occurred while fetching team details."
              );
            }
            break;
        }
      },
      undefined,
      this.context.subscriptions
    );
  }

  async updateContent(flowTracker) {
    if (!this.panel) return;

    const metrics = flowTracker.getMetrics();
    const teamDetails = await this.fetchTeamDetails(); // Get team details
    this.panel.webview.html = this.getWebviewContent(metrics, teamDetails);

    if (metrics.needsBreak) {
      flowTracker.breakSuggested = true;
      vscode.window
        .showInformationMessage(
          "🌟 Time for a quick break! Your focus metrics suggest you could use a refresh.",
          "Take Break",
          "Dismiss"
        )
        .then((selection) => {
          if (selection === "Take Break") {
            vscode.window.showInformationMessage(
              "👍 Good choice! Try some quick exercises or grab a drink of water."
            );
          }
        });
    }
  }

  getWebviewContent(metrics, teams) {
    const errorSummary = metrics.getErrorSummary();

    const teamsSection = teams
      ? `
      <div class="teams-section">
        ${teams
          .map(
            (team) => `
          <div class="team-card">
            <div class="team-header">
              <h3>${team.name}</h3>
              <span class="team-creator">Created by: ${
                team.members.find((m) => m._id === team.creator)?.username ||
                "Unknown"
              }</span>
            </div>
            <div class="team-members">
              <h4>Members:</h4>
              <ul>
                ${team.members
                  .map(
                    (member) => `
                  <li>
                    <span class="member-name">${member.username}</span>
                    <span class="member-email">${member.email}</span>
                  </li>
                `
                  )
                  .join("")}
              </ul>
            </div>
            <div class="team-meta">
              <span class="team-date">Created: ${new Date(
                team.createdAt
              ).toLocaleDateString()}</span>
            </div>
          </div>
        `
          )
          .join("")}
      </div>
    `
      : "<p>No teams available</p>";

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Flow State Analytics</title>
            <style>
        :root {
            /* Catppuccin Mocha Theme Colors */
            --rosewater: #f5e0dc;
            --flamingo: #f2cdcd;
            --pink: #f5c2e7;
            --mauve: #cba6f7;
            --red: #f38ba8;
            --maroon: #eba0ac;
            --peach: #fab387;
            --yellow: #f9e2af;
            --green: #a6e3a1;
            --teal: #94e2d5;
            --sky: #89dceb;
            --sapphire: #74c7ec;
            --blue: #89b4fa;
            --lavender: #b4befe;
            --text: #cdd6f4;
            --subtext1: #bac2de;
            --subtext0: #a6adc8;
            --overlay2: #9399b2;
            --overlay1: #7f849c;
            --overlay0: #6c7086;
            --surface2: #585b70;
            --surface1: #45475a;
            --surface0: #313244;
            --base: #1e1e2e;
            --mantle: #181825;
            --crust: #11111b;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            padding: 20px;
            color: var(--text);
            background-color: var(--base);
            line-height: 1.5;
        }
            
          ..metric-card {
    @apply bg-[#313244] rounded-xl p-6;
    @apply border-2 border-[#45475a];
    @apply transition-all duration-300;
    @apply hover:shadow-xl hover:shadow-[#181825]/20;
}

.metric-header {
    @apply flex justify-between items-center mb-6;
    @apply border-b border-[#45475a] pb-4;
}

.metric-title {
    @apply text-[#cba6f7] text-lg font-semibold;
}

.metric-icon {
    @apply text-2xl;
}
.team-actions {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-top: 20px;
}

.team-button {
    padding: 10px;
    border: 1px solid var(--mauve);
    border-radius: 6px;
    background-color: var(--surface0);
    color: var(--text);
    cursor: pointer;
    transition: all 0.2s;
}
.team-button:hover {
    background-color: var(--mauve);
    color: var(--base);
}


/* Rest of the existing styles remain unchanged */
.team-card {
    @apply bg-[#313244] rounded-xl p-6;
    @apply border-2 border-[#45475a];
    @apply transition-all duration-300;
    @apply hover:shadow-xl hover:shadow-[#181825]/20;
    @apply hover:-translate-y-1;
}

.team-header {
    @apply flex justify-between items-center;
    @apply border-b border-[#45475a] pb-4 mb-4;
}

.team-header h3 {
    @apply text-[#cba6f7] text-lg font-semibold;
}

.team-creator {
    @apply text-[#a6adc8] text-sm;
}

.team-members h4 {
    @apply text-[#89dceb] font-medium mb-3;
}

.team-members ul {
    @apply space-y-2;
}

.team-members li {
    @apply flex justify-between items-center;
    @apply py-2 border-b border-[#45475a] last:border-0;
}

.member-name {
    @apply text-[#cdd6f4] font-medium;
}

.member-email {
    @apply text-[#a6adc8] text-sm;
}

.team-meta {
    @apply mt-4 text-[#a6adc8] text-sm;
}

.team-date {
    @apply flex items-center gap-2;
}
        .container {
            max-width: 1200px;
            margin: 0 auto;
        }
        .dashboard {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin-top: 20px;
        }
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 30px;
            padding: 20px;
            background-color: var(--surface0);
            border-radius: 15px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.2);
            border: 2px solid var(--surface1);
            position: relative;
        }
        .header::before {
            content: "";
            position: absolute;
            top: -15px;
            left: 20px;
            font-size: 24px;
            animation: bounce 2s infinite;
        }
        @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-10px); }
        }
        .title-section {
            display: flex;
            align-items: center;
            gap: 15px;
        }
        .title-section h1 {
            margin: 0;
            font-size: 24px;
            color: var(--mauve);
        }
        .status-badge {
            padding: 8px 16px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 500;
            background-color: var(--sapphire);
            color: var(--crust);
        }
        .metric-card {
            background-color: var(--surface0);
            border: 2px solid var(--surface1);
            border-radius: 15px;
            padding: 20px;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
        }
        .metric-card::after {
            content: "";
            position: absolute;
            bottom: -2px;
            left: -2px;
            right: -2px;
            height: 4px;
            background: linear-gradient(90deg, var(--mauve), var(--blue));
            opacity: 0;
            transition: opacity 0.3s ease;
        }
        .metric-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }
        .metric-card:hover::after {
            opacity: 1;
        }
        .metric-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        .metric-title {
            font-size: 16px;
            color: var(--lavender);
            font-weight: 600;
        }
        .metric-icon {
            font-size: 24px;
            color: var(--sky);
        }
        .metric-value {
            font-size: 32px;
            font-weight: bold;
            color: var(--text);
            margin: 10px 0;
        }
        .metric-subtitle {
            font-size: 14px;
            color: var(--subtext0);
        }
        .progress-bar {
            width: 100%;
            height: 8px;
            background-color: var(--surface1);
            border-radius: 4px;
            margin-top: 15px;
            overflow: hidden;
        }
        .progress-value {
            height: 100%;
            background: linear-gradient(90deg, var(--mauve), var(--blue));
            transition: width 0.3s ease;
            border-radius: 4px;
        }
        .focus-score {
            font-size: 48px;
            font-weight: bold;
            text-align: center;
            margin: 20px 0;
            color: var(--mauve);
            text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.2);
        }
        .streak-badge {
            display: inline-flex;
            align-items: center;
            gap: 5px;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            background-color: var(--sapphire);
            color: var(--crust);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }
        .button {
            padding: 10px 20px;
            border: none;
            border-radius: 25px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        .primary-button {
            background-color: var(--mauve);
            color: var(--crust);
        }
        .primary-button:hover {
            background-color: var(--pink);
            transform: translateY(-2px);
        }
        .secondary-button {
            background-color: var(--surface1);
            color: var(--text);
            border: 2px solid var(--mauve);
        }
        .secondary-button:hover {
            background-color: var(--surface2);
            transform: translateY(-2px);
        }
        .teams-container {
            margin-top: 30px;
            padding: 20px;
            background-color: var(--surface0);
            border-radius: 15px;
            border: 2px solid var(--surface1);
        }
        .teams-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid var(--surface1);
        }
        .teams-title {
            font-size: 24px;
            color: var(--mauve);
            margin: 0;
        }
        .team-card {
            background-color: var(--surface0);
            border: 2px solid var(--surface1);
            border-radius: 15px;
            padding: 20px;
            margin-bottom: 20px;
            transition: all 0.3s ease;
        }
        .team-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
        }
        .team-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
            padding-bottom: 10px;
            border-bottom: 2px solid var(--surface1);
        }
        .team-header h3 {
            margin: 0;
            color: var(--mauve);
        }
        .team-members {
            margin: 15px 0;
        }
        .team-members h4 {
            color: var(--sky);
            margin: 0 0 10px 0;
        }
        .team-members ul {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .team-members li {
            display: flex;
            justify-content: space-between;
            padding: 8px 0;
            border-bottom: 1px solid var(--surface1);
        }
        .team-members li:last-child {
            border-bottom: none;
        }
        .member-name {
            color: var(--text);
            font-weight: 500;
        }
        .member-email {
            color: var(--subtext0);
            font-size: 14px;
        }
        .error-list {
            margin-top: 15px;
            max-height: 200px;
            overflow-y: auto;
            border-radius: 10px;
            border: 1px solid var(--surface1);
        }
        .error-item {
            padding: 10px;
            border-left: 4px solid;
            margin-bottom: 5px;
            background-color: var(--surface0);
        }
        .error-item.error { border-color: var(--red); }
        .error-item.warning { border-color: var(--yellow); }
        .error-item.info { border-color: var(--blue); }
        .language-badge {
            padding: 4px 12px;
            border-radius: 15px;
            font-size: 12px;
            background-color: var(--surface1);
            color: var(--text);
            margin: 2px;
        }
        @media (max-width: 768px) {
            .dashboard {
                grid-template-columns: 1fr;
            }
            .header {
                flex-direction: column;
                gap: 15px;
            }
        }
    </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <div class="title-section">
                        <h1>Flow State Analytics</h1>
                        <div class="status-badge">${
                          metrics.productivityStatus
                        }</div>
                    </div>
                    <div class="actions">
                        <button class="button secondary-button" onclick="resetMetrics()">Reset Session</button>
                              <button class="button primary-button" onclick="logout()">Logout</button>
                    </div>
                </div>

                  <div class="metric-card">
                    <div class="metric-header">
                        <div class="metric-title">Team Management</div>
                        <div class="metric-icon">👥</div>
                    </div>
                    <div class="team-actions">
                        <button class="team-button" onclick="createTeam()">Create Team</button>
                        <button class="team-button" onclick="viewTeam()">View Team</button>
                        <button class="team-button" onclick="addTeamMember()">Add Member</button>
                        <button class="team-button" onclick="removeTeamMember()">Remove Member</button>
                    </div>
                </div>

                <div class="dashboard">
                    <!-- Focus Score Card -->
                    <div class="metric-card">
                        <div class="metric-header">
                            <div class="metric-title">Focus Score</div>
                            <div class="metric-icon">🎯</div>
                        </div>
                        <div class="focus-score">${metrics.focusScore.toFixed(
                          0
                        )}</div>
                        <div class="streak-badge">
                            🔥 ${metrics.currentStreak} min streak
                        </div>
                        <div class="progress-bar">
                            <div class="progress-value" style="width: ${
                              metrics.focusScore
                            }%"></div>
                        </div>
                    </div>

                    <!-- Session Stats -->
                    <div class="metric-card">
                        <div class="metric-header">
                            <div class="metric-title">Session Statistics</div>
                            <div class="metric-icon">⏱️</div>
                        </div>
                        <div class="metric-value">${metrics.sessionDuration.toFixed(
                          1
                        )} min</div>
                        <div class="metric-subtitle">Session Duration</div>
                        <div class="metric-subtitle">
                            Longest Streak: ${metrics.longestStreak} minutes
                        </div>
                    </div>

                    <!-- Activity Metrics -->
                    <div class="metric-card">
                        <div class="metric-header">
                            <div class="metric-title">Activity Metrics</div>
                            <div class="metric-icon">📊</div>
                        </div>
                        <div class="metric-value">${metrics.fileEdits}</div>
                        <div class="metric-subtitle">
                            ${metrics.linesAdded} lines added • ${
      metrics.linesDeleted
    } lines removed
                        </div>
                        <div class="progress-bar">
                            <div class="progress-value" style="width: ${Math.min(
                              (metrics.fileEdits / 50) * 100,
                              100
                            )}%"></div>
                        </div>
                    </div>

                    <!-- Copy/Paste Metrics -->
<div class="metric-card">
    <div class="metric-header">
        <div class="metric-title">Copy/Paste Activity</div>
        <div class="metric-icon">📋</div>
    </div>
    <div class="metric-value">${metrics.copyPasteMetrics.total}</div>
    <div class="metric-subtitle">
        ${metrics.copyPasteMetrics.copy} copies • ${
      metrics.copyPasteMetrics.cut
    } cuts • ${metrics.copyPasteMetrics.paste} pastes
    </div>
    <div class="progress-bar">
        <div class="progress-value" style="width: ${Math.min(
          (metrics.copyPasteMetrics.total / 20) * 100,
          100
        )}%"></div>
    </div>
</div>


                    <!-- Typing Rhythm -->
                    <div class="metric-card">
                        <div class="metric-header">
                            <div class="metric-title">Typing Rhythm</div>
                            <div class="metric-icon">⌨️</div>
                        </div>
                        <div class="metric-value">${metrics.typingRhythm.toFixed(
                          1
                        )}%</div>
                        <div class="metric-subtitle">Consistency Score</div>
                        <div class="progress-bar">
                            <div class="progress-value" style="width: ${
                              metrics.typingRhythm
                            }%"></div>
                        </div>
                    </div>

                    <!-- Navigation Patterns -->
                   <!-- Navigation Patterns -->
<div class="metric-card">
    <div class="metric-header">
        <div class="metric-title">Navigation Patterns</div>
        <div class="metric-icon">🔄</div>
    </div>
    <div class="metric-value">${metrics.tabMetrics.total}</div>
    <div class="metric-subtitle">
        ${metrics.windowSwitchCount} window switches • ${
      metrics.tabMetrics.rapid
    } tab switches • ${metrics.commandUsage} commands 
    </div>
    <div class="progress-bar">
        <div class="progress-value" style="width: ${Math.min(
          (metrics.tabSwitchCount / 30) * 100,
          100
        )}%"></div>
    </div>
</div>
                    <!-- Debug Metrics -->
                    <div class="metric-card">
                        <div class="metric-header">
                            <div class="metric-title">Debug Metrics</div>
                            <div class="metric-icon">🐛</div>
                        </div>
                        <div class="metric-value">${
                          metrics.breakpointCount
                        }</div>
                        <div class="metric-subtitle">
                            Active Breakpoints • ${
                              metrics.errorCount
                            } Errors Detected
                        </div>
                        <div class="progress-bar">
                            <div class="progress-value" style="width: ${Math.min(
                              (metrics.breakpointCount / 10) * 100,
                              100
                            )}%"></div>
                        </div>
                    </div>

                    <!-- Error Summary -->
                    <div class="metric-card">
                        <div class="metric-header">
                            <div class="metric-title">Error Analysis</div>
                            <div class="metric-icon">🔍</div>
                        </div>
                        <div class="metric-value">
                            ${errorSummary.bySeverity.error} Errors • ${
      errorSummary.bySeverity.warning
    } Warnings
                        </div>
                        
                        <div class="language-errors">
                            ${Object.entries(errorSummary.byLanguage)
                              .map(
                                ([lang, errors]) => `
                                <div class="language-badge">
                                    ${lang}: ${Object.values(errors).reduce(
                                  (a, b) => a + b,
                                  0
                                )}
                                </div>
                            `
                              )
                              .join("")}
                        </div>
                        
                        <div class="error-list">
                            ${errorSummary.recent
                              .map(
                                (error) => `
                                <div class="error-item ${
                                  error.severity === 1
                                    ? "error"
                                    : error.severity === 2
                                    ? "warning"
                                    : "info"
                                }">
                                    <div class="error-location">Line ${
                                      error.line
                                    }:${error.column}</div>
                                    <div>${error.message}</div>
                                </div>
                            `
                              )
                              .join("")}
                        </div>

                        
                    </div>
                </div>

                 <div class="teams-container">
                    <div class="teams-header">
                        <h2 class="teams-title">Your Teams</h2>
                    </div>
                    ${teamsSection}
                </div>
            </div>

              <script>
                const vscode = acquireVsCodeApi();
                
                function resetMetrics() {
                    vscode.postMessage({ command: 'reset' });
                }

                function logout() {
                    vscode.postMessage({ command: 'logout' });
                }

                function createTeam() {
                    vscode.postMessage({ command: 'createTeam' });
                }

                function addTeamMember() {
                    vscode.postMessage({ command: 'addTeamMember' });
                }

                function removeTeamMember() {
                    vscode.postMessage({ command: 'removeTeamMember' });
                }

                function viewTeam() {
                    vscode.postMessage({ command: 'viewTeam' });
                }

                // Auto-refresh every second
                setInterval(() => {
                    vscode.postMessage({ command: 'refresh' });
                }, 1000);
            </script>
        </body>
        </html>`;
  }
}

class FlowStateTracker {
  constructor() {
    this.reset();
    this.settings = {
      focusThreshold: 70,
      breakInterval: 45,
      typingConsistencyWeight: 0.3,
      errorPenalty: 5,
      tabSwitchPenalty: 1,
      windowSwitchPenalty: 2,
      streakBonus: 2,
      productivityThresholds: {
        high: 80,
        medium: 60,
        low: 40,
      },
      codeQualityMetrics: {
        cleanCodeScore: 0.2,
        complexityThreshold: 10,
        testCoverageGoal: 80,
        documentationWeight: 0.3,
      },
      languageSupport: {
        javascript: true,
        typescript: true,
        python: true,
        java: true,
        csharp: true,
        go: true,
        rust: true,
        php: true,
        ruby: true,
      },
      tabMetrics: {
        rapidSwitchThreshold: 4000, // milliseconds
        penaltyMultiplier: 1.5,
      },
    };
  }

  reset() {
    this.activeFileStartTime = new Date();
    this.lastTypeTime = new Date();
    this.idleStartTime = new Date();
    this.sessionStartTime = new Date();
    this.lastStreakUpdate = new Date();
    this.typingIntervals = [];
    this.focusScore = 100;
    this.focusHistory = [];
    this.productivityScore = 100;
    this.errorCount = 0;
    this.tabSwitches = 0;
    this.breakpoints = 0;
    this.consoleInteractions = 0;
    this.windowSwitches = 0;
    this.commandCount = 0;
    this.fileEdits = 0;
    this.searchOperations = 0;
    this.refactoringActions = 0;
    this.debuggingSessions = 0;
    this.longestFocusStreak = 0;
    this.currentFocusStreak = 0;
    this.peakProductivityTime = null;
    this.breakSuggested = false;
    this.productivityPeaks = [];
    this.focusDips = [];
    this.linesAdded = 0;
    this.linesDeleted = 0;
    this.syntaxErrors = 0;
    this.codeComplexity = 0;
    this.testCoverage = 0;
    this.documentationUpdates = 0;
    this.codingPatterns = {
      conditionals: 0,
      loops: 0,
      functions: 0,
      classes: 0,
      async: 0,
      syntax: 0,
      unused: 0,
      undefined: 0,
    };
    this.errorLog = [];
    this.languageSpecificErrors = {
      javascript: { syntax: 0, reference: 0, type: 0 },
      typescript: { syntax: 0, type: 0, interface: 0 },
      python: { syntax: 0, indentation: 0, import: 0 },
      java: { syntax: 0, compilation: 0, runtime: 0 },
      go: { syntax: 0, package: 0, type: 0 },
      rust: { syntax: 0, borrow: 0, lifetime: 0 },
      php: { syntax: 0, undefined: 0, type: 0 },
      ruby: { syntax: 0, undefined: 0, gem: 0 },
    };
    this.cleanCodeMetrics = {
      functionLength: [],
      cyclomaticComplexity: [],
      dependencyCount: [],
      cohesionScore: 0,
      duplicateCode: 0,
    };
    this.codeQualityScore = 100;
    this.commentLines = 0;
    this.intellisenseUsage = 0;
    this.quickFixUsage = 0;
    this.snippetUsage = 0;
    this.symbolNavigation = 0;
    this.problemCount = 0;
    this.warningCount = 0;
    this.flowStateAchievements = [];
    this.lastTabSwitchTime = new Date();
    this.rapidTabSwitches = 0;
    this.copyPasteOperations = {
      total: 0,
      copy: 0,
      cut: 0,
      paste: 0,
      lastOperation: null,
    };
    this.tabSwitchPatterns = {
      backAndForth: 0,
      sequential: 0,
      lastTabs: [],
    };
  }

  async saveSessionToDatabase(flowTracker) {
    const metrics = flowTracker.getMetrics();
    const errorSummary = flowTracker.getErrorSummary();

    const user = extensionContext.globalState.get("userToken");

    // Extract just the user ID from the user object
    const userId = user?.id || user?._id;

    if (!userId) {
      console.error("No user ID found!");
      return;
    }

    console.log("Session data to be saved:", metrics);

    const sessionData = {
      timestamp: new Date(),
      userId: userId,
      focusScore: metrics.focusScore || 0,
      currentStreak: metrics.currentStreak || 0,
      longestStreak: metrics.longestStreak || 0,
      sessionDuration: metrics.sessionDuration || 0,
      activeFileDuration: metrics.activeFileDuration || 0,
      idleTime: metrics.idleTime || 0,
      typingRhythm: metrics.typingRhythm || 0,
      tabMetrics: {
        total: metrics.tabMetrics?.total || 0,
        rapid: metrics.tabMetrics?.rapid || 0,
        patterns: {
          backAndForth: metrics.tabMetrics?.patterns?.backAndForth || 0,
          sequential: metrics.tabMetrics?.patterns?.sequential || 0,
        },
      },
      copyPasteMetrics: {
        total: metrics.copyPasteMetrics?.total || 0,
        copy: metrics.copyPasteMetrics?.copy || 0,
        cut: metrics.copyPasteMetrics?.cut || 0,
        paste: metrics.copyPasteMetrics?.paste || 0,
      },
      errorMetrics: {
        syntaxErrors: metrics.syntaxErrors || 0,
        warningCount: metrics.warningCount || 0,
        problemCount: metrics.problemCount || 0,
      },
      codeMetrics: {
        linesAdded: metrics.linesAdded || 0,
        linesDeleted: metrics.linesDeleted || 0,
        fileEdits: metrics.fileEdits || 0,
        codeComplexity: metrics.codeComplexity || 0,
        testCoverage: metrics.testCoverage || 0,
      },
      productivityStatus: metrics.productivityStatus || "Unknown",
      achievements: metrics.achievements || [],
      errorSummary: errorSummary || {},
    };

    try {
      const response = await fetch("http://localhost:5000/api/save-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionData),
      });

      if (!response.ok) {
        throw new Error(`Failed to save session data: ${response.statusText}`);
      }

      const result = await response.json();
      console.log("Session data saved successfully:", result);
    } catch (err) {
      console.error("Error saving session data:", err);
    }
  }

  trackTabSwitch(fromTab, toTab) {
    let now = new Date();
    const timeSinceLastSwitch = now - this.lastTabSwitchTime;

    // Track rapid switches
    if (timeSinceLastSwitch < this.settings.tabMetrics.rapidSwitchThreshold) {
      this.rapidTabSwitches++;
    }

    // Track tab switch patterns
    this.tabSwitchPatterns.lastTabs.push(toTab);
    if (this.tabSwitchPatterns.lastTabs.length > 3) {
      this.tabSwitchPatterns.lastTabs.shift();

      // Detect back and forth pattern (A -> B -> A)
      if (
        this.tabSwitchPatterns.lastTabs[0] ===
        this.tabSwitchPatterns.lastTabs[2]
      ) {
        this.tabSwitchPatterns.backAndForth++;
      }

      // Detect sequential pattern (A -> B -> C)
      if (
        new Set(this.tabSwitchPatterns.lastTabs).size ===
        this.tabSwitchPatterns.lastTabs.length
      ) {
        this.tabSwitchPatterns.sequential++;
      }
    }

    this.tabSwitches++;
    this.lastTabSwitchTime = now;
  }

  // Add new method to track copy/paste operations
  trackCopyPaste(operation) {
    this.copyPasteOperations.total++;
    this.copyPasteOperations[operation]++;
    this.copyPasteOperations.lastOperation = {
      type: operation,
      timestamp: new Date(),
    };
  }

  trackError(diagnostic, languageId) {
    const errorInfo = {
      timestamp: new Date(),
      message: diagnostic.message,
      severity: diagnostic.severity,
      line: diagnostic.range.start.line + 1,
      column: diagnostic.range.start.character + 1,
      source: diagnostic.source || languageId,
      code: diagnostic.code,
    };

    this.errorLog.push(errorInfo);

    if (this.errorLog.length > 50) {
      this.errorLog.shift();
    }

    if (this.languageSpecificErrors[languageId]) {
      const errorType = this.categorizeError(diagnostic.message, languageId);
      if (this.languageSpecificErrors[languageId][errorType]) {
        this.languageSpecificErrors[languageId][errorType]++;
      }
    }
  }

  categorizeError(message, languageId) {
    message = message.toLowerCase();

    switch (languageId) {
      case "javascript":
      case "typescript":
        if (message.includes("undefined") || message.includes("not defined"))
          return "reference";
        if (message.includes("type")) return "type";
        return "syntax";

      case "python":
        if (message.includes("indentation")) return "indentation";
        if (message.includes("import")) return "import";
        return "syntax";

      case "java":
        if (message.includes("cannot find symbol")) return "compilation";
        if (message.includes("runtime")) return "runtime";
        return "syntax";

      default:
        return "syntax";
    }
  }

  getErrorSummary() {
    return {
      total: this.errorLog.length,
      bySeverity: {
        error: this.errorLog.filter(
          (e) => e.severity === vscode.DiagnosticSeverity.Error
        ).length,
        warning: this.errorLog.filter(
          (e) => e.severity === vscode.DiagnosticSeverity.Warning
        ).length,
        info: this.errorLog.filter(
          (e) => e.severity === vscode.DiagnosticSeverity.Information
        ).length,
      },
      byLanguage: Object.entries(this.languageSpecificErrors)
        .filter(([_, errors]) =>
          Object.values(errors).some((count) => count > 0)
        )
        .reduce((acc, [lang, errors]) => {
          acc[lang] = errors;
          return acc;
        }, {}),
      recent: this.errorLog.slice(-5),
    };
  }


  async updateFocusScore() {
    const now = new Date();
    
    const sessionDuration = (now.getTime() - this.sessionStartTime.getTime()) / 1000 / 60;
    const activeFileDuration = (now.getTime() - this.activeFileStartTime.getTime()) / 1000 / 60;
    const idleTime = (now.getTime() - this.idleStartTime.getTime()) / 1000 / 60;
    const typingRhythm = this.calculateTypingRhythm();

    console.log('Current metrics before update:', {
        currentStreak: this.currentFocusStreak,
        longestStreak: this.longestFocusStreak,
        sessionDuration,
        activeFileDuration,
        idleTime,
        typingRhythm,
        focusScore: this.focusScore
    });

    try {
        const response = await fetch("http://127.0.0.1:8000/predict/focus", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                currentStreak: this.currentFocusStreak,
                longestStreak: this.longestFocusStreak,
                sessionDuration: sessionDuration,
                activeFileDuration: activeFileDuration,
                idleTime: idleTime,
                typingRhythm: typingRhythm,
            }),
        });

        const data = await response.json();
        if (response.ok) {
          this.focusScore = data["Gradient Boosting Regression"];
            console.log("Focus score from API:", this.focusScore);
        } else {
            console.error("API Error: ", data);
        }
    } catch (error) {
        console.error("Fetch Error: ", error);
        // Fallback calculation if API fails
        this.focusScore = Math.max(0, Math.min(100, 
            100 - (idleTime * 2) + 
            (this.currentFocusStreak * 0.5) - 
            (this.tabSwitches * 0.2) - 
            (this.windowSwitches * 0.5)
        ));
    }

    this.focusHistory.push({
        timestamp: now,
        score: this.focusScore,
    });

    // Update streaks more frequently (every 30 seconds)
    const timeSinceLastUpdate = (now.getTime() - this.lastStreakUpdate.getTime()) / 1000;

    if (timeSinceLastUpdate >= 30) { // Update every 30 seconds
        const isInFocusState = this.focusScore > this.settings.focusThreshold || 
                              (activeFileDuration > 0 && idleTime < 1);

        console.log('Focus state check:', {
            isInFocusState,
            focusScore: this.focusScore,
            threshold: this.settings.focusThreshold,
            activeFileDuration,
            idleTime
        });

        if (isInFocusState) {
            // Convert the 30-second interval to minutes (0.5 minutes)
            this.currentFocusStreak += 0.5;
            console.log('Incrementing streak to:', this.currentFocusStreak);
            
            if (this.currentFocusStreak > this.longestFocusStreak) {
                this.longestFocusStreak = this.currentFocusStreak;
                console.log('New longest streak:', this.longestFocusStreak);
                this.checkForAchievements();
            }
        } else {
            if (this.currentFocusStreak > 0) {
                this.focusDips.push({
                    timestamp: now,
                    duration: this.currentFocusStreak,
                });
                console.log('Resetting streak from:', this.currentFocusStreak);
            }
            this.currentFocusStreak = 0;
        }
        
        this.lastStreakUpdate = now;
    }

    if (
        this.focusScore > 90 &&
        (!this.peakProductivityTime ||
            now.getTime() - this.peakProductivityTime.getTime() > 1000 * 60 * 15)
    ) {
        this.productivityPeaks.push({
            timestamp: now,
            score: this.focusScore,
        });
        this.peakProductivityTime = now;
    }

    console.log('Updated metrics:', {
        currentStreak: this.currentFocusStreak,
        longestStreak: this.longestFocusStreak,
        focusScore: this.focusScore
    });
}




  calculateTypingRhythm() {
    if (this.typingIntervals.length < 2) return 100;

    const intervals = this.typingIntervals.slice(-30);
    const avgInterval = intervals.reduce((a, b) => a + b) / intervals.length;

    const weightedVariance =
      intervals.reduce((acc, val, idx) => {
        const weight = (idx + 1) / intervals.length;
        return acc + weight * Math.pow(val - avgInterval, 2);
      }, 0) / intervals.length;

    const consistency = 100 - Math.min(100, Math.sqrt(weightedVariance) / 8);
    return consistency;
  }

  updateCodeQualityScore() {
    let score = 100;

    score -= Math.max(
      0,
      this.codeComplexity - this.settings.codeQualityMetrics.complexityThreshold
    );

    if (this.testCoverage < this.settings.codeQualityMetrics.testCoverageGoal) {
      score -=
        (this.settings.codeQualityMetrics.testCoverageGoal -
          this.testCoverage) *
        0.5;
    }

    const docRatio = this.commentLines / Math.max(1, this.linesAdded);
    score +=
      (docRatio - 0.2) *
      this.settings.codeQualityMetrics.documentationWeight *
      100;

    const avgFunctionLength =
      this.cleanCodeMetrics.functionLength.length > 0
        ? this.cleanCodeMetrics.functionLength.reduce((a, b) => a + b) /
          this.cleanCodeMetrics.functionLength.length
        : 0;

    score -= Math.max(0, (avgFunctionLength - 20) * 0.5);

    this.codeQualityScore = Math.max(0, Math.min(100, score));
  }

  shouldSuggestBreak() {
    const sessionDuration =
      (new Date().getTime() - this.sessionStartTime.getTime()) / 1000 / 60;
    const lowFocusScore = this.focusScore < this.settings.focusThreshold;
    const longSession = sessionDuration > this.settings.breakInterval;
    const highIntensity = this.productivityScore > 90 && sessionDuration > 30;

    return (
      !this.breakSuggested && (lowFocusScore || longSession || highIntensity)
    );
  }

  checkForAchievements() {
    const achievements = [];

    if (this.longestFocusStreak >= 30) {
      achievements.push({
        type: "FLOW_MASTER",
        description: "30+ minutes of sustained focus!",
      });
    }

    if (this.productivityPeaks.length >= 3) {
      achievements.push({
        type: "PRODUCTIVITY_GURU",
        description: "Achieved 3 productivity peaks in one session!",
      });
    }

    if (this.cleanCodeMetrics.cohesionScore > 90) {
      achievements.push({
        type: "CLEAN_CODE_CHAMPION",
        description: "Maintained high code quality standards!",
      });
    }

    if (achievements.length > 0) {
      this.flowStateAchievements.push(...achievements);
      vscode.window.showInformationMessage(
        `🏆 Achievement Unlocked: ${achievements[0].description}`
      );
    }
  }

  getMetrics() {
    this.updateFocusScore();
    this.updateCodeQualityScore();

    const sessionDuration =
      (new Date().getTime() - this.sessionStartTime.getTime()) / 1000 / 60;
    const activeFileDuration =
      (new Date().getTime() - this.activeFileStartTime.getTime()) / 1000;
    const idleTime =
      (new Date().getTime() - this.idleStartTime.getTime()) / 1000;

    return {
      focusScore: this.focusScore,
      currentStreak: this.currentFocusStreak,
      longestStreak: this.longestFocusStreak,
      sessionDuration,
      activeFileDuration,
      idleTime,
      typingRhythm: this.calculateTypingRhythm(),
      tabSwitchCount: this.tabSwitches,
      windowSwitchCount: this.windowSwitches,
      commandUsage: this.commandCount,
      breakpointCount: this.breakpoints,
      errorCount: this.syntaxErrors,
      problemCount: this.problemCount,
      warningCount: this.warningCount,
      linesAdded: this.linesAdded,
      linesDeleted: this.linesDeleted,
      fileEdits: this.fileEdits,
      codeComplexity: this.codeComplexity,
      testCoverage: this.testCoverage,
      codingPatterns: this.codingPatterns,
      codeQualityScore: this.codeQualityScore,
      cleanCodeMetrics: this.cleanCodeMetrics,
      productivityPeaks: this.productivityPeaks,
      focusDips: this.focusDips,
      achievements: this.flowStateAchievements,
      intellisenseUsage: this.intellisenseUsage,
      quickFixUsage: this.quickFixUsage,
      snippetUsage: this.snippetUsage,
      symbolNavigation: this.symbolNavigation,
      needsBreak: this.shouldSuggestBreak(),
      productivityStatus: this.getProductivityStatus(),
      focusHistory: this.focusHistory.slice(-60),
      productivityTrend: this.calculateProductivityTrend(),
      getErrorSummary: () => this.getErrorSummary(),
      tabMetrics: {
        total: this.tabSwitches,
        rapid: this.rapidTabSwitches,
        patterns: {
          backAndForth: this.tabSwitchPatterns.backAndForth,
          sequential: this.tabSwitchPatterns.sequential,
        },
      },
      copyPasteMetrics: {
        total: this.copyPasteOperations.total,
        copy: this.copyPasteOperations.copy,
        cut: this.copyPasteOperations.cut,
        paste: this.copyPasteOperations.paste,
      },
    };
  }

  calculateProductivityTrend() {
    if (this.focusHistory.length < 2) return "stable";

    const recentScores = this.focusHistory.slice(-10);
    const avgRecent =
      recentScores.reduce((a, b) => a + b.score, 0) / recentScores.length;
    const prevScores = this.focusHistory.slice(-20, -10);

    if (prevScores.length === 0) return "stable";
    const avgPrev =
      prevScores.reduce((a, b) => a + b.score, 0) / prevScores.length;
    const diff = avgRecent - avgPrev;

    if (diff > 5) return "improving";
    if (diff < -5) return "declining";
    return "stable";
  }

  getProductivityStatus() {
    const { high, medium, low } = this.settings.productivityThresholds;

    if (this.focusScore >= high) return "Flow State 🚀";
    if (this.focusScore >= medium) return "In The Zone 💪";
    if (this.focusScore >= low) return "Focused 🎯";
    return "Getting Started 🌱";
  }
}

let extensionContext;

async function activate(context) {
  extensionContext = context;
  console.log("Flow state detection extension is now active");

  const isAuthenticated = await authenticateUser();

  if (!isAuthenticated) {
    vscode.window.showErrorMessage(
      "You must log in to use this extension. Reload the window to try again."
    );
    return; // Exit if authentication fails
  }

  const flowTracker = new FlowStateTracker();
  const webview = new FlowStateWebview(context);

  // Add copy/paste tracking
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      "editor.action.clipboardCopyAction",
      async (textEditor) => {
        const selection = textEditor.selection;
        if (!selection.isEmpty) {
          const text = textEditor.document.getText(selection);
          await vscode.env.clipboard.writeText(text);
          flowTracker.trackCopyPaste("copy");
          webview.updateContent(flowTracker);
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      "editor.action.clipboardCutAction",
      async (textEditor) => {
        const selection = textEditor.selection;
        if (!selection.isEmpty) {
          const text = textEditor.document.getText(selection);
          await vscode.env.clipboard.writeText(text);
          await textEditor.edit((editBuilder) => {
            editBuilder.delete(selection);
          });
          flowTracker.trackCopyPaste("cut");
          webview.updateContent(flowTracker);
        }
      }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      "editor.action.clipboardPasteAction",
      async (textEditor) => {
        const text = await vscode.env.clipboard.readText();
        await textEditor.edit((editBuilder) => {
          editBuilder.replace(textEditor.selection, text);
        });
        flowTracker.trackCopyPaste("paste");
        webview.updateContent(flowTracker);
      }
    )
  );

  // Add tab switch tracking
  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor((editor) => {
      if (editor) {
        const currentTab = editor.document.fileName;
        flowTracker.trackTabSwitch(null, currentTab);
        webview.updateContent(flowTracker);
      }
    })
  );

  context.subscriptions.push(
    vscode.languages.onDidChangeDiagnostics((e) => {
      let totalErrors = 0;
      let totalWarnings = 0;

      for (const uri of e.uris) {
        const document = vscode.workspace.textDocuments.find(
          (doc) => doc.uri.toString() === uri.toString()
        );
        const languageId = document ? document.languageId : "unknown";
        const diagnostics = vscode.languages.getDiagnostics(uri);

        diagnostics.forEach((diagnostic) => {
          if (diagnostic.severity === vscode.DiagnosticSeverity.Error) {
            totalErrors++;
          } else if (
            diagnostic.severity === vscode.DiagnosticSeverity.Warning
          ) {
            totalWarnings++;
          }

          flowTracker.trackError(diagnostic, languageId);
        });
      }

      flowTracker.syntaxErrors = totalErrors;
      flowTracker.warningCount = totalWarnings;

      webview.updateContent(flowTracker);
    })
  );

  context.subscriptions.push(
    vscode.debug.onDidChangeBreakpoints((e) => {
      if (e.added) flowTracker.breakpoints += e.added.length;
      if (e.removed) flowTracker.breakpoints -= e.removed.length;
      webview.updateContent(flowTracker);
    })
  );

  context.subscriptions.push(
    vscode.window.onDidChangeWindowState((e) => {
      if (!e.focused) {
        flowTracker.windowSwitches++;
        webview.updateContent(flowTracker);
      }
    })
  );

  let showMetricsDisposable = vscode.commands.registerCommand(
    "extension.getFlowMetrics",
    () => {
      webview.createOrShowPanel(flowTracker);
    }
  );

  let resetMetricsDisposable = vscode.commands.registerCommand(
    "extension.resetFlowMetrics",
    async () => {
      flowTracker.reset();
      webview.updateContent(flowTracker);
      vscode.window.showInformationMessage("Flow metrics have been reset");
    }
  );

  setInterval(async () => {
    await flowTracker.saveSessionToDatabase(flowTracker);
  }, 300000);

  context.subscriptions.push(showMetricsDisposable);
  context.subscriptions.push(resetMetricsDisposable);

  context.subscriptions.push(
    vscode.workspace.onDidChangeTextDocument((event) => {
      const now = new Date();
      const interval = now.getTime() - flowTracker.lastTypeTime.getTime();

      if (interval < 5000) {
        flowTracker.typingIntervals.push(interval);
      }

      const uri = event.document.uri;
      const diagnostics = vscode.languages.getDiagnostics(uri);

      flowTracker.syntaxErrors = diagnostics.filter(
        (d) => d.severity === vscode.DiagnosticSeverity.Error
      ).length;
      flowTracker.warningCount = diagnostics.filter(
        (d) => d.severity === vscode.DiagnosticSeverity.Warning
      ).length;
      flowTracker.problemCount = diagnostics.length;

      flowTracker.lastTypeTime = now;
      flowTracker.idleStartTime = now;
      flowTracker.commandCount++;
      flowTracker.fileEdits++;

      event.contentChanges.forEach((change) => {
        const newLineCount = (change.text.match(/\n/g) || []).length;
        const removedLineCount =
          change.range.end.line - change.range.start.line;
        flowTracker.linesAdded += newLineCount;
        flowTracker.linesDeleted += removedLineCount;
      });

      webview.updateContent(flowTracker);
    })
  );

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      // Await the result of the analyzeCodeFromEditor function
      const analysis = await analyzeCodeFromEditor();

      // If no analysis result is returned (in case of error or no editor), exit early
      if (!analysis) {
        console.error("No analysis result found!");
        return;
      }

      const user = extensionContext.globalState.get("userToken");

      // Extract just the user ID from the user object
      const userId = user?.id || user?._id;

      if (!userId) {
        console.error("No user ID found!");
        return;
      }

      const payload = {
        userId: userId, // Now sending just the ID string
        language: document.languageId,
        problem: {
          type: analysis.problem.type,
          domain: analysis.problem.domain,
          functionality: analysis.problem.functionality,
          complexity: analysis.problem.complexity,
        },
        complexity: {
          time: analysis.complexity.time,
          space: analysis.complexity.space,
        },
        quality: {
          readability: analysis.quality.readability,
          maintainability: analysis.quality.maintainability,
          modularity: analysis.quality.modularity,
          documentation: analysis.quality.documentation,
          errorHandling: analysis.quality.errorHandling,
          duplication: analysis.quality.duplication || 0,
        },
        errors: {
          typeErrorRisk: analysis.errors.typeErrorRisk || 0,
          referenceErrorRisk: analysis.errors.referenceErrorRisk || 0,
          syntaxErrorRisk: analysis.errors.syntaxErrorRisk || 0,
          mostLikelyError: analysis.errors.mostLikelyError || 'Unknown'
        }
      };

      try {
        const response = await fetch("http://localhost:5000/api/analysis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        const responseText = await response.text();

        // Parse the response only if it's JSON
        if (response.ok) {
          try {
            const responseData = JSON.parse(responseText);
            console.log("Code analysis saved successfully:", responseData);
          } catch (e) {
            console.error("Error parsing response:", e);
          }
        } else {
          console.error(
            "Failed to save code analysis:",
            response.statusText,
            responseText
          );
        }
      } catch (error) {
        console.error("Network or other error:", error);
      }
    })
  );
}
function deactivate() {}

module.exports = {
  activate,
  deactivate,
  FlowStateTracker,
  FlowStateWebview,
};
