/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2019 */

import os from "os";
import path from "path";
import yargs from "yargs";

import { ADDON_STATUS_STRINGS, AMOSession, AMORedashClient, getConfig } from "amolib";
import JSAmo from "./jsamo";

(async function() {
  let config = getConfig();

  let argv = yargs
    .option("debug", {
      "boolean": true,
      "global": true,
      "describe": "Enable debugging"
    })
    .option("debugSequential", {
      "boolean": true,
      "global": true,
      "describe": "When logging requests, group request and response"
    })
    .command("adminstatus [ids...]", "Show status for the add-ons", (subyargs) => {

    })
    .command("adminchange [ids...]", "Admin-disable an add-on and all its files", (subyargs) => {
      subyargs.option("d", {
        "alias": "disable",
        "boolean": true,
        "conflicts": "enable",
        "describe": "Disable specified versions"
      })
        .option("e", {
          "alias": "enable",
          "conflicts": "disable",
          "boolean": true,
          "describe": "Enable specified versions"
        })
        .option("s", {
          alias: "status",
          choices: Object.keys(ADDON_STATUS_STRINGS),
          nargs: 1,
          describe: "The add-on status to set"
        })
        .option("v", {
          alias: "versions",
          array: true,
          describe: "Specific versions to enable/disable"
        })
        .example("$0 adminchange -d", "Disable all files and the add-on itself")
        .example("$0 adminchange -e", "Enable all files and set the add-on to approved")
        .example("$0 adminchange -s disabled", "Just change the add-on status to disabled")
        .example("$0 adminchange -d -v 3.1 3.4", "Disable versions 3.1 and 3.4, leaving the add-on status as is");
    })
    .command("adminban [ids...]", "Ban the given user ids", (subyargs) => {
      subyargs.option("c", {
        "alias": "chunk",
        "type": "number",
        "default": 1,
        "nargs": 1,
        "describe": "The number of requests to fire at a time"
      });
    })
    .command("info", "[pyamo] Show basic information about an add-on")
    .command("run", "[pyamo] Run an add-on in Firefox (preferably in a VM)")
    .command("logs", "[pyamo] Show the review logs")
    .command("get", "[pyamo] Download one or more versions of an add-on, including sources")
    .command("list", "[pyamo] List add-ons in the given queue")
    .command("upload", "[pyamo] Upload an add-on to addons.mozilla.org")
    .command("adminget", "[pyamo] Show admin manage information about an add-on")
    .command("decide", "[pyamo] Make a review decision for an add-on, along with message")
    .demandCommand(1, 1, "Error: Missing required command")
    .wrap(120)
    .argv;

  let jsamo = new JSAmo({
    amo: new AMOSession({
      debug: argv.debug,
      sequential: argv.debugSequential
    }),
    redash: new AMORedashClient({
      apiToken: config.auth && config.auth.redash_key,
      debug: argv.debug
    })
  });

  jsamo.amo.loadCookies(path.join(os.homedir(), ".amo_cookie"));

  switch (argv._[0]) {
    case "adminchange":
      await jsamo.adminchange(argv.ids, argv);
      break;
    case "adminstatus":
      await jsamo.adminstatus(argv.ids);
      break;
    case "adminban":
      await jsamo.ban(argv.ids, argv);
      break;

    case "info":
    case "run":
    case "logs":
    case "get":
    case "list":
    case "upload":
    case "adminget":
    case "decide":
      await jsamo.pyamo(process.argv.slice(2));
      break;
  }
})().catch((err) => {
  console.error(err);
});
