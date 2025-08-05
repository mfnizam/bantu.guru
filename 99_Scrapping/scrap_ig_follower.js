const username = "dikbudmalangkota";

let followers = [];
let followings = [];
let dontFollowMeBack = [];
let iDontFollowBack = [];

function exportToCSV(data, filename) {
  if (!data.length) return;

  const header = Object.keys(data[0]).join(",");
  const rows = data.map((row) => Object.values(row).join(","));
  const csvContent = [header, ...rows].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${filename}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

(async () => {
  try {
    console.log(`Process started! Give it a couple of seconds`);

    const userQueryRes = await fetch(`https://www.instagram.com/web/search/topsearch/?query=${username}`);
    const userQueryJson = await userQueryRes.json();

    const userId = userQueryJson.users.map((u) => u.user).filter((u) => u.username === username)[0].pk;

    let after = null;
    let has_next = true;

    while (has_next) {
      await fetch(
        `https://www.instagram.com/graphql/query/?query_hash=c76146de99bb02f6415203be841dd25a&variables=` +
          encodeURIComponent(JSON.stringify({ id: userId, include_reel: true, fetch_mutual: true, first: 50, after }))
      )
        .then((res) => res.json())
        .then((res) => {
          has_next = res.data.user.edge_followed_by.page_info.has_next_page;
          after = res.data.user.edge_followed_by.page_info.end_cursor;
          followers = followers.concat(
            res.data.user.edge_followed_by.edges.map(({ node }) => ({
              username: node.username,
              full_name: node.full_name,
              latest_reel: node.latest_reel_media,
              is_private: node.is_private,
            }))
          );
        });
    }

    after = null;
    has_next = true;
    while (has_next) {
      await fetch(
        `https://www.instagram.com/graphql/query/?query_hash=d04b0a864b4b54837c0d870b0e77e076&variables=` +
          encodeURIComponent(JSON.stringify({ id: userId, include_reel: true, fetch_mutual: true, first: 50, after }))
      )
        .then((res) => res.json())
        .then((res) => {
          has_next = res.data.user.edge_follow.page_info.has_next_page;
          after = res.data.user.edge_follow.page_info.end_cursor;
          followings = followings.concat(
            res.data.user.edge_follow.edges.map(({ node }) => ({
              username: node.username,
              full_name: node.full_name,
              latest_reel: node.latest_reel_media,
              is_private: node.is_private,
            }))
          );
        });
    }

    // dontFollowMeBack = followings.filter((following) => !followers.find((f) => f.username === following.username));
    // iDontFollowBack = followers.filter((follower) => !followings.find((f) => f.username === follower.username));

    // Export all to CSV
    exportToCSV(followers, "followers");
    exportToCSV(followings, "followings");
    // exportToCSV(dontFollowMeBack, "dontFollowMeBack");
    // exportToCSV(iDontFollowBack, "iDontFollowBack");

    console.log("CSV files generated and download should have started.");
  } catch (err) {
    console.log({ err });
  }
})();
