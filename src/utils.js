/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 * Portions Copyright (C) Philipp Kewisch, 2019 */

export function chunk(array, size=50) {
  let chunks = [];
  for (let i = 0, len = array.length; i < len; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}
