#!/bin/bash
# ============================================================
#  KARE SIS — Full build script
#  Run: bash build.sh
# ============================================================
set -e

PROJECT="$HOME/Project/Kare-Att"
SDK_SRC="/opt/android-sdk"
SDK_DST="$HOME/android-sdk"

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   KARE SIS — Android Build Script   ║"
echo "╚══════════════════════════════════════╝"
echo ""

# ── Step 1: Copy SDK to home if not done yet ─────────────────
if [ ! -d "$SDK_DST" ]; then
  echo "▶ Step 1/6: Copying Android SDK to ~/android-sdk (takes 1-2 min)..."
  cp -r "$SDK_SRC" "$SDK_DST"
  echo "   ✓ SDK copied"
else
  echo "▶ Step 1/6: SDK already at ~/android-sdk — skipping copy"
fi

# ── Step 2: Fix local.properties ─────────────────────────────
echo "▶ Step 2/6: Setting SDK path in local.properties..."
echo "sdk.dir=$SDK_DST" > "$PROJECT/android/local.properties"
echo "   ✓ local.properties updated"

# ── Step 3: Accept all SDK licenses ──────────────────────────
echo "▶ Step 3/6: Accepting SDK licenses..."
SDKMANAGER=""
for path in \
  "$SDK_DST/cmdline-tools/latest/bin/sdkmanager" \
  "$SDK_DST/cmdline-tools/tools/bin/sdkmanager" \
  "$SDK_DST/tools/bin/sdkmanager"; do
  if [ -f "$path" ]; then
    SDKMANAGER="$path"
    break
  fi
done

# Accept licenses by writing hash files directly
mkdir -p "$SDK_DST/licenses"
printf "\n24333f8a63b6825ea9c5514f83c2829b004d1fee\n8933bad161af4178b1185d1a37fbf41ea5269c55\nd56f5187479451eabf01fb78af6dfcb131a6481e" \
  > "$SDK_DST/licenses/android-sdk-license"
printf "\n84831b9409646a918e30573bab4c9c91346d8abd" \
  > "$SDK_DST/licenses/android-sdk-preview-license"
printf "\nd975f751698a77b662f1254ddbeed3901e976f5a" \
  > "$SDK_DST/licenses/intel-android-extra-license"

# Also try sdkmanager if found
if [ -n "$SDKMANAGER" ]; then
  yes | "$SDKMANAGER" --licenses > /dev/null 2>&1 || true
  echo "   ✓ Licenses accepted via sdkmanager"
else
  echo "   ✓ Licenses written manually"
fi

# ── Step 4: Build React app ───────────────────────────────────
echo "▶ Step 4/6: Building React app..."
cd "$PROJECT"
npm run build
echo "   ✓ React build done → dist/"

# ── Step 5: Sync Capacitor ────────────────────────────────────
echo "▶ Step 5/6: Syncing Capacitor to Android..."
npx cap sync android
echo "   ✓ Capacitor synced"

# ── Step 6: Build APK ─────────────────────────────────────────
echo "▶ Step 6/6: Building APK with Gradle..."
cd "$PROJECT/android"

# Set explicit JDK for 21 compatibility (using 25 which supports 21)
export JAVA_HOME="/usr/lib/jvm/java-25-openjdk"
export ANDROID_HOME="$SDK_DST"
export ANDROID_SDK_ROOT="$SDK_DST"
export PATH="$JAVA_HOME/bin:$SDK_DST/platform-tools:$SDK_DST/cmdline-tools/latest/bin:$PATH"

chmod +x gradlew
./gradlew assembleDebug --no-daemon 2>&1

APK="$PROJECT/android/app/build/outputs/apk/debug/app-debug.apk"

if [ -f "$APK" ]; then
  # Copy APK to home for easy access
  cp "$APK" "$HOME/KARE-SIS.apk"
  echo ""
  echo "╔══════════════════════════════════════════════╗"
  echo "║   ✅  BUILD SUCCESSFUL!                      ║"
  echo "║   APK → ~/KARE-SIS.apk                      ║"
  echo "╚══════════════════════════════════════════════╝"
  echo ""
  echo "Install on phone (USB + USB debugging on):"
  echo "  $SDK_DST/platform-tools/adb install ~/KARE-SIS.apk"
  echo ""
else
  echo ""
  echo "✗ Build failed — APK not found"
  echo "  Check errors above"
  exit 1
fi
