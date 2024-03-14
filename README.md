# partykit-nextjs-monaco-editor-example

This is an example of how to leverage [partykit](http://github.com/partykit/partykit) and [monaco-react](https://github.com/suren-atoyan/monaco-react) to create a collaborative editor experience when you're building with [NextJS](http://github.com/vercel/next.js) and [`bun`](http://github.com/oven-sh/bun).

## Getting Started

If you'd like to hit the ground running,

1. Make sure you've installed `bun`. I'm using `1.0.30` for this example.
1. Run the following:

    ```bash
    git clone https://github.com/anthonycorletti/partykit-nextjs-monaco-editor-example.git && cd partykit-nextjs-monaco-editor-example
    bun install
    bun dev
    ```

## Starting from scratch

If you'd like to dig in a bit deeper, here's how I made this step by step if you'd like to follow along and extend or implement this for your own purposes:

1. Create your nextjs app with bun

    ```sh
    > bun create next-app
    ✔ What is your project named? … partykit-nextjs-monaco-editor-example
    ✔ Would you like to use TypeScript? … No / Yes
    ✔ Would you like to use ESLint? … No / Yes
    ✔ Would you like to use Tailwind CSS? … No / Yes
    ✔ Would you like to use `src/` directory? … No / Yes
    ✔ Would you like to use App Router? (recommended) … No / Yes
    ✔ Would you like to customize the default import alias (@/*)? … No / Yes
    ```

1. Make sure that worked by running `bun dev` and viewing the new app in your browser.

1. Now let's install our dependencies

    ```sh
    bun add @monaco-editor/react y-monaco y-partykit yjs partysocket
    ```

1. Let's make a new directory and file for our new code editor page.

    ```sh
    mkdir -p app/code
    touch app/code/page.tsx
    ```

1. First, let's put some scaffolding in place. Drop this into `app/code/page.tsx`

    ```tsx
    "use client"

    export default function EditorPage() {
        return (
            <div className="flex flex-col min-h-screen">
                <h1>Editor</h1>
                <p>Some content</p>
            </div>
        )
    }
    ```

    This tells next to consider this page a part of the client bundle, and exports our default function `EditorPage` so that it can return the HTML content to our browser. 

    If you go to http://localhost:3000/code, you should see this page.

1. Now, let's fill out some more details. First, we'll import everything we need.

    ```tsx
    "use client"

    import { useEffect } from 'react';
    import Editor, { useMonaco } from '@monaco-editor/react';

    import BetterWebSocket from "partysocket/ws";
    import YPartyKitProvider from "y-partykit/provider";
    import { MonacoBinding } from "y-monaco";
    import * as Y from "yjs";

    //...
    ```

1. And next we'll scaffold out more of our `EditorPage`.  First, let's set what we want to return.

    ```tsx
    //...

    export default function EditorPage() {

        //...

        return (
            <section className="min-h-screen items-center justify-center mx-auto max-w-2xl space-y-2 m-5">
                <Editor
                    theme="vs-dark"
                    defaultLanguage="javascript"
                    defaultValue="// what good shall we do this day?"
                    className="bg-background h-[720px] shadow-lg"
                />
                <button id="y-connect-button" className="px-4 py-3 bg-neutral-200 rounded font-medium hover:bg-neutral-300 transition duration-300 dark:bg-neutral-500 dark:hover:bg-neutral-600">👋 Disconnect</button>
            </section>
        )
    }
    ```

1. And now, we'll fill in some details to configure `monaco` in this function

    ```tsx
    // ...
    export default function EditorPage() {
        const monaco = useMonaco();

        useEffect(() => {
            if (typeof window !== "undefined") {
                if (monaco) {
                    console.log("hello monaco!")
                }
            }
        }, [monaco]);

        //...
    }
    ```

    We're using `useEffect` here because we have to fetch client side information in monaco that we want to feed to yjs and partykit.

1. Solid! Now we should be able to see the editor appear when we navigate to http://localhost:3000/code. Open the browser's console and your should see `hello monaco!` too.

1. Now, our final step, we're going to configure `yjs`, `y-monaco`,  and partykit.

    ```tsx
    export default function EditorPage() {
        const monaco = useMonaco();

        useEffect(() => {
            if (typeof window !== "undefined") {
                if (monaco) {
                    // create a yew yjs doc
                    const ydoc = new Y.Doc();
                    // establish partykit as your websocket provider
                    const provider = new YPartyKitProvider("http://localhost:1999", "nextjs-monaco-demo", ydoc, {
                        // @ts-expect-error TODO: fix this
                        WebSocketPolyfill: BetterWebSocket
                    });
                    // send a readiness check to partykit
                    provider.ws?.send("it's happening!");
                    // get the text from the monaco editor
                    const yDocTextMonaco = ydoc.getText("monaco");
                    // get the monaco editor
                    const editor = monaco.editor.getEditors()[0];
                    // create the monaco binding to the yjs doc
                    new MonacoBinding(
                        yDocTextMonaco,
                        editor.getModel()!,
                        // @ts-expect-error TODO: fix this
                        new Set([editor]),
                        provider.awareness
                    );
                    // enable a button to connect and disconnect from partykit
                    const connectButton = document.getElementById("y-connect-button")!;
                    connectButton.addEventListener("click", () => {
                        if (provider.shouldConnect) {
                            provider.disconnect();
                            connectButton.textContent = "🎈 Connect";
                        } else {
                            provider.connect();
                            connectButton.textContent = "👋 Disconnect";
                        }
                    });
                }
            }
        }, [monaco]);

        //...
    }
    ```

    Checkout the inline comments for more details on what's going on there!

1. Almost there! Let's add some styling to the indicator so we can notice different people typing when we go to http://localhost:3000/code in another browser window or tab. Add the following css to `app/globals.css`

    ```css
    .yRemoteSelection {
        background-color: rgb(250, 129, 0, 0.5);
    }

    .yRemoteSelectionHead {
        position: absolute;
        border-left: orange solid 2px;
        border-top: orange solid 2px;
        border-bottom: orange solid 2px;
        height: 100%;
        box-sizing: border-box;
    }

    .yRemoteSelectionHead::after {
        position: absolute;
        content: " ";
        border: 3px solid orange;
        border-radius: 4px;
        left: -4px;
        top: -5px;
    }
    ```

    Note that these won't change per user. I'm leaving that one for another time, but you should be able to do it by adding some user metadata to the monaco editor.


1. Now let's integrate partykit!

    ```
    bunx partykit init
    ```

    Make sure to "add to an existing project"

1. I like to keep my `ts` files in `lib/` so I moved the `party/main.ts` to `lib/pk.ts`, and replaced the content of that `lib/pk.ts` with the following.

    ```ts
    import type * as Party from "partykit/server";
    import { onConnect } from "y-partykit";
    import * as Y from "yjs";

    export default class Server implements Party.Server {
        constructor(public room: Party.Room) { }
        async onConnect(connection: Party.Connection) {
            const room = this.room;

            await onConnect(connection, this.room, {
                async load() {
                    const doc = new Y.Doc();
                    // NOTE: You could load data from a database into the doc here.
                    return doc;
                },
                callback: {
                    handler: async (doc) => {
                        // This is called every few seconds if the document has changed
                        // convert the Yjs document to a Uint8Array
                        const content = Y.encodeStateAsUpdate(doc);
                        // NOTE: You could save the content to a database here.
                    },
                },
            });
        }
    }
    ```

1. Make sure that your `partykit.json` looks something like the following:

    ```json
    {
        "$schema": "https://www.partykit.io/schema.json",
        "name": "partykit-nextjs-monaco-editor-example-party",
        "main": "lib/pk.ts",
        "compatibilityDate": "2024-03-14"
    }
    ```

1. As a convenience, I added `partykit dev --live` as a script in `package.json` under `pk-dev`

1. Finally! In one shell session, run `bun dev`, and in another, run `bun run pk-dev`.

1. Open http://localhost:3000/code in two tabs and/or windows in your browser, and notice that there are two different cursors! You should see each client update as you type in one. How awesome!

1. Ah one last (optional) thing. If you noticed nextjs's server console, it's complaining about nested css in our code page. We can fix this by enabling nesting.

    First, update our `postcss.confg.js` to look like the following

    ```js
    module.exports = {
        plugins: {
            'tailwindcss/nesting': 'postcss-nesting',
            tailwindcss: {},
            autoprefixer: {},
        },
    };
    ```

    And install `postcss-nesting`

    ```sh
    bun add postcss-nesting -D
    ```



## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
