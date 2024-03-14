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