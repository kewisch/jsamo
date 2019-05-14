/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2019 */

import { spawnSync } from "child_process";

import {
  ADDON_STATUS, ADDON_STATUS_STRINGS,
  UserAdminPage, AddonAdminPage
} from "amolib";

import { chunk } from "./utils";

export async function adminchange(session, ids=[], args={}) {
  let failed = [];

  await Promise.all(ids.map(async (id) => {
    let addon = new AddonAdminPage(session, id);

    let status = ADDON_STATUS_STRINGS[args.status];
    let hasStatus = ADDON_STATUS_STRINGS.hasOwnProperty(args.status);

    try {
      if (args.versions) {
        if (hasStatus) {
          addon.status = status;
        }
        if (args.enable) {
          await addon.enableVersions(args.versions);
        } else if (args.disable) {
          await addon.disableVersions(args.versions);
        }
      } else if (args.enable) {
        addon.status = hasStatus ? ADDON_STATUS.APPROVED : status;
        await addon.enableFiles();
      } else if (args.disable) {
        addon.status = hasStatus ? ADDON_STATUS.DISABLED : status;
        await addon.disableFiles();
      }
    } catch (e) {
      console.error(e);
      failed.push(id);
    }
  }));


  if (failed.length) {
    console.error("Failed to process the following ids:\n");
    console.error(failed.join("\n"));
  } else {
    console.log(`Processed changes for ${ids.length} add-ons`);
  }
}

export async function ban(session, ids, argv) {
  let failed = [];
  let commandStart = new Date();

  async function banUser(id) {
    let start = new Date();
    let user = new UserAdminPage(session, id);
    return user.ban().then(() => {
      console.log(`Banned ${id} in ${((new Date()) - start) / 1000} seconds`);
    }, (e) => {
      console.error(e);
      failed.push(id);
    });
  }

  let chunks = argv.chunk == 0 ? [ids] : chunk(ids, argv.chunk);

  await chunks.reduce((previous, chunkids, idx) => {
    return previous.then(() => {
      console.log(`Starting chunk ${idx + 1} of ${chunks.length}`);
      return Promise.all(chunkids.map(id => banUser(id)));
    });
  }, Promise.resolve());


  if (failed.length) {
    console.error("Failed to ban the following users:\n");
    console.error(failed.join("\n"));
  } else {
    console.log(`Banned ${ids.length} users in ${(new Date() - commandStart) / 1000} seconds`);
  }
}

export async function pyamo(argv) {
  let callpyamo = require.resolve("../contrib/callpyamo.py");
  let result = spawnSync(callpyamo, argv, { stdio: "inherit" });

  if (result.status == 254) {
    let usage = yargs.getUsageInstance();
    usage.fail("Error: pyamo is not installed");
  }
  process.exit(result.status);
}
