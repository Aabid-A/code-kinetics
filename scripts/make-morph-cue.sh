#!/usr/bin/env bash
# Synthesises the morph sound cue (SPEC R09) with the system ffmpeg; no third-party audio, no npm dependency.
# A short band-passed noise burst (fixed seed) plus a soft downward sine blip, each with a 2 ms attack and an
# exponential decay, then a 15 ms fade-out. 130 ms of audio (156.7 ms as six MP3 frames), mono, peak-normalised to
# -6 dBFS before encoding. Deterministic: bit-exact flags and no metadata, so every run writes the same bytes.
set -euo pipefail

cd "$(dirname "$0")/.."
out="public/audio/morph.mp3"
mkdir -p "$(dirname "$out")"

rate=44100
length=0.130
attack=0.002
envelope() { echo "if(lt(t,$attack),t/$attack,exp(-(t-$attack)/$1))"; }

graph="
anoisesrc=d=$length:c=white:r=$rate:a=1:seed=20261108,
  highpass=f=1500:poles=2, lowpass=f=5000:poles=2,
  aeval='val(0)*$(envelope 0.018)':c=mono, volume=0.45 [noise];
aevalsrc='sin(2*PI*(1400*t-2000*t*t))*$(envelope 0.035)':s=$rate:d=$length:c=mono, volume=0.55 [blip];
[noise][blip] amix=inputs=2:normalize=0, atrim=duration=$length,
  afade=t=out:st=$(awk -v l="$length" 'BEGIN { print l - 0.015 }'):d=0.015 [mix]"

# Pass 1: measure the mixed peak, then scale so the peak lands at exactly -6 dBFS.
peak=$(ffmpeg -hide_banner -nostats -filter_complex "$graph; [mix] volumedetect [measured]" -map "[measured]" -f null - 2>&1 \
  | sed -n 's/.*max_volume: \(-\?[0-9.]*\) dB/\1/p')
gain=$(awk -v p="$peak" 'BEGIN { printf "%.4f", -6 - p }')

ffmpeg -hide_banner -loglevel error -y -filter_complex "$graph; [mix] volume=${gain}dB [cue]" -map "[cue]" \
  -ac 1 -ar "$rate" -c:a libmp3lame -b:a 64k -map_metadata -1 -fflags +bitexact -flags:a +bitexact "$out"

echo "wrote $out ($(wc -c < "$out") bytes; pre-encode peak ${peak} dBFS, gain ${gain} dB)"
