import { FluentProvider, teamsLightTheme } from "@fluentui/react-components";
import { View } from "@fluent-blocks/react";
import { useEffect, useState } from "react";

export function Dashboard() {
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    const fetchIssues = async () => {
      setIssues(await getIssues());
    };
    fetchIssues();
  }, []);

  return (
    <FluentProvider theme={teamsLightTheme}>
      <View
        main={{
          title: "",
          blocks: [
            {
              dashboard: {
                items: [
                  {
                    item: {
                      widget: {
                        title: [{ text: "GitHub Issues" }],
                        label: "Demo Widget",
                        abstract: [{ text: "Updated just now" }],
                        tabs: [
                          {
                            tab: { label: "Issues" },
                            panel: [
                              {
                                descriptionList: [
                                  {
                                    title: "Assigned",
                                    description: `${issues.length}`,
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                        footerAction: {
                          actionId: "open-issues",
                          label: "Open in GitHub",
                          icon: "arrow_right",
                          iconPosition: "after",
                        },
                      },
                    },
                  },
                ],
              },
            },
          ],
        }}
      />
    </FluentProvider>
  );
}

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
                updatedAt                
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

    const response = await fetch("https://api.github.com/graphql", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.REACT_APP_GITHUB_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    const result = await response.json();
    issues = result.data.repository.issues.edges.map((edge: any) => {
      return edge.node;
    });
  } catch (error) {
    console.log(error);
  }

  return issues;
}
