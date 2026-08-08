#!/bin/sh
#
# stamp-build.sh — record the current commit in version.js, so the running page
# can say which build it is.
#
# Run it from anywhere in the repo, then commit the result:
#
#     yard-master/tools/stamp-build.sh
#     git commit -am "chore(3d): stamp build"
#
# The stamp names the commit that is HEAD right now — the last one carrying
# real changes. It cannot name the commit that records the stamp itself,
# because writing a hash into a file changes that file's hash.

set -eu

root=$(git rev-parse --show-toplevel)
target="$root/yard-master/version.js"

commit=$(git rev-parse --short HEAD)
date=$(git show -s --format=%cs HEAD)
repo=$(git config --get remote.origin.url \
    | sed -e 's#.*[/:]\([^/]*/[^/]*\)$#\1#' -e 's#\.git$##')

[ -n "$repo" ] || repo='neskil/neskil.github.io'

tmp="$target.tmp"
sed \
    -e "s/^\( *commit: \).*$/\1'$commit',/" \
    -e "s/^\( *date: \).*$/\1'$date',/" \
    -e "s#^\( *repo: \).*\$#\1'$repo'#" \
    "$target" > "$tmp"
mv "$tmp" "$target"

echo "stamped $commit ($date) into ${target#"$root"/}"
