/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2019 */

import { spawnSync } from "child_process";
import { SingleBar, Presets } from "cli-progress";

import {
  ADDON_STATUS, ADDON_STATUS_STRINGS, ADDON_STATUS_VALUES,
  AddonAdminPage, DjangoUserModels
} from "amolib";

export default class JSAmo {
  constructor({ amo, redash }) {
    this.amo = amo;
    this.redash = redash;
  }

  async adminstatus(ids=[]) {
    let format = "Getting status [{bar}] {percentage}% | ETA: {eta_formatted} | {value}/{total}";
    let bar = new SingleBar({ format }, Presets.legacy);
    bar.start(ids.length, 0);

    let status = await Promise.all(ids.map(async (id) => {
      let addon = new AddonAdminPage(this.amo, id);
      await addon.loadPage();
      bar.increment();

      return `${id}: ${ADDON_STATUS_VALUES[parseInt(addon.status, 10)]}`;
    }));
    bar.stop();

    console.log(status.join("\n"));
  }

  async adminchange(ids=[], args={}) {
    let failed = [];
    let format = "Changing add-ons [{bar}] {percentage}% | ETA: {eta_formatted} | {value}/{total}";
    let bar = new SingleBar({ format }, Presets.legacy);
    bar.start(ids.length, 0);

    await Promise.all(ids.map(async (id) => {
      let addon = new AddonAdminPage(this.amo, id);
      await addon.ensureLoaded();

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
          addon.status = hasStatus ? status : ADDON_STATUS.APPROVED;
          await addon.enableFiles();
        } else if (args.disable) {
          addon.status = hasStatus ? status : ADDON_STATUS.DISABLED;
          await addon.disableFiles();
        } else if (hasStatus) {
          addon.status = status;
          await addon.update([]);
        }
      } catch (e) {
        console.error(e);
        failed.push(id);
      }

      bar.increment();
    }));
    bar.stop();

    if (failed.length) {
      console.error("Failed to process the following ids:\n");
      console.error(failed.join("\n"));
    } else {
      console.log(`Processed changes for ${ids.length} add-ons`);
    }
  }

  async ban(ids, argv) {
    let start = new Date();
    let userModels = new DjangoUserModels(this.amo);

    await userModels.ban(ids);
    console.log(`Banned ${ids.length} users in ${(new Date() - start) / 1000} seconds`);
  }

  async pyamo(argv) {
    let callpyamo = require.resolve("../contrib/callpyamo.py");
    let result = spawnSync(callpyamo, argv, { stdio: "inherit" });

    if (result.status == 254) {
      let usage = yargs.getUsageInstance();
      usage.fail("Error: pyamo is not installed");
    }
    process.exit(result.status);
  }
}
