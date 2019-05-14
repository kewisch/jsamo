jsamo - addons.mozilla.org for node
===================================

These tools provide some classes and a command line tool to access addons.mozilla.org. It makes use
of a number of sources such as the AMO API, screen scraping, kinto and redash to quickly interact
with the site. It is meant mainly as a tool for add-on reviewers and admins.

The command line tool is installed under the name `amo` and has the following commands available:

    adminchange   Change the status of an add-ons and its files using the admin manage page
    adminban      Ban users using the django admin pages

This tool will slowly inherit features from [pyamo](https://github.com/kewisch/pyamo). If you have
pyamo installed, it will fall back to using pyamo for the missing features, so you can safely have
jsamo override the `amo` command.

Configuration
-------------

This tool doesn't currently have FxA authentication set up. You can either set up the necessary
cookies automatically by calling any `pyamo` command that will log you in, or you can steal the
cookies from your browser. For the latter option, observe any request to addons.mozilla.org in your
devtools, go to the cookies tab and copy the value of the `sessionid` cookie. Then put this in the
cookie file at `~/.amo_cookie` as a JSON object:

```
{ "sessionid": "your_session_id_from_firefox" }
```

Make sure to set the file mode `0600` so nobody else has write access. Pull requests to use OS-level
keystores are welcome.
