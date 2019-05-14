#!/usr/bin/env python

__requires__ = 'pyamo'
import re
import sys
from pkg_resources import load_entry_point, DistributionNotFound

if __name__ == '__main__':
    sys.argv[0] = "amo"
    try:
      sys.exit(
          load_entry_point('pyamo', 'console_scripts', 'amo')()
      )
    except DistributionNotFound:
      sys.exit(254);

