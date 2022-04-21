import { AzureFunction, Context } from "@azure/functions";
import { AdaptiveCards } from "@microsoft/adaptivecards-tools";
import notificationTemplate from "./adaptiveCards/notification-default.json";
import { CardData, Issue } from "./cardModels";
import { bot } from "./internal/initialize";
import axios from "axios";
import { Member, TeamsFx, UserInfo } from "@microsoft/teamsfx";

// Time trigger to send notification. You can change the schedule in ../timerNotifyTrigger/function.json
const timerTrigger: AzureFunction = async function (
  context: Context,
  myTimer: any
): Promise<void> {
  const issues = await getIssues();

  if (issues.length > 0) {
    const staleIssues = issues.filter((issue: Issue) => {
      const issueDate = new Date(issue.updatedAt);
      const now = new Date();
      const diff = now.getTime() - issueDate.getTime();
      const diffDays = Math.ceil(diff / (1000 * 3600 * 24));
      return diffDays >= 7;
    });

    if (staleIssues.length > 0) {
      for (const target of await bot.notification.installations()) {
        for (const member of await target.members()) {
          await target.sendAdaptiveCard(
            AdaptiveCards.declare<CardData>(notificationTemplate).render({
              title: `👋 Hello, ${member.account.givenName}! These issues need your attention!`,
              issues: staleIssues,
              notificationUrl: "https://github.com/issues/assigned",
            })
          );
        }
      }
    }
  }

  /****** To distinguish different target types ******/
  /** "Channel" means this bot is installed to a Team (default to notify General channel)
  if (target.type === "Channel") {
    // Directly notify the Team (to the default General channel)
    await target.sendAdaptiveCard(...);

    // List all channels in the Team then notify each channel
    const channels = await target.channels();
    for (const channel of channels) {
      await channel.sendAdaptiveCard(...);
    }

    // List all members in the Team then notify each member
    const members = await target.members();
    for (const member of members) {
      await member.sendAdaptiveCard(...);
    }
  }
  **/

  /** "Group" means this bot is installed to a Group Chat
  if (target.type === "Group") {
    // Directly notify the Group Chat
    await target.sendAdaptiveCard(...);

    // List all members in the Group Chat then notify each member
    const members = await target.members();
    for (const member of members) {
      await member.sendAdaptiveCard(...);
    }
  }
  **/

  /** "Person" means this bot is installed as a Personal app
  if (target.type === "Person") {
    // Directly notify the individual person
    await target.sendAdaptiveCard(...);
  }
  **/
};

async function getIssues() {
  let issues = [];

  try {
    const body = {
      query: `query($owner:String!, $name:String!) { 
        repository(owner: $owner, name: $name) { 
          issues(first: 100, filterBy: { assignee: $owner }) { 
            edges { 
              node { 
                id
                number
                title
                updatedAt                
                url
              } 
            } 
          } 
        } 
      }`,
      variables: {
        owner: process.env.REACT_APP_GITHUB_OWNER,
        name: process.env.REACT_APP_GITHUB_REPO,
      },
    };

    const response = await axios.post("https://api.github.com/graphql", body, {
      headers: {
        Authorization: `Bearer ${process.env.REACT_APP_GITHUB_TOKEN}`,
      },
    });

    const result: any = await response.data;
    issues = result.data.repository.issues.edges.map((edge: { node: any }) => {
      return edge.node;
    });
  } catch (error) {
    console.log(error);
  }

  return issues;
}

export default timerTrigger;
