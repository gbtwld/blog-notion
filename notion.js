const { Client } = require("@notionhq/client");
const { NotionToMarkdown } = require("notion-to-md");
const fs = require("fs");
require("dotenv").config();

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_POST_DATABASE_ID = process.env.NOTION_POST_DATABASE_ID;

// Initializing a client
const notion = new Client({
    auth: NOTION_TOKEN,
});

const n2m = new NotionToMarkdown({ notionClient: notion });

let postsData = [];

async function pageToMD(id, title, tags, createdTime) {
    const mdblocks = await n2m.pageToMarkdown(id);
    const mdString = n2m.toMarkdownString(mdblocks);
    mdString.parent = `---\ntitle: ${title}\ntags: [${tags}]\nauthor: gbtwld\n---\n` + mdString.parent;

    const createdTimeDate = new Date(createdTime).toISOString().split("T")[0];

    const fileName = createdTimeDate.toString() + "-" + title.replace(" ", "_") + ".md";

    fs.mkdir("./posts", { recursive: true }, (err) => {
        if (err) throw err;
    });
    fs.writeFile(`./posts/${fileName}`, mdString.parent, (err) => console.log(err));
}

async function convertPosts() {
    postsData.forEach((post) => {
        const tags = post.properties["태그"].multi_select.map((tag) => tag.name);
        const title = post.properties["제목"].title[0].plain_text;
        pageToMD(post.id, title, tags, post.created_time);
    });
}

async function getDatabase() {
    try {
        const res = await notion.databases.query({
            database_id: NOTION_POST_DATABASE_ID,
        });
        postsData = res.results;
    } catch (error) {
        console.log(error);
    }
}

async function main() {
    await getDatabase();
    await convertPosts();
}

main();
