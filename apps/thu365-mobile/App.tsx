import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, AppState, Image, Linking, Modal, Pressable,
  SafeAreaView, ScrollView, StatusBar, StyleSheet, Text, View
} from "react-native";
import {
  CameraView, useCameraPermissions, useMicrophonePermissions, type CameraType
} from "expo-camera";
import * as MediaLibrary from "expo-media-library/legacy";

type Screen = "intro" | "camera" | "gallery";
type OptionalPrompt = "microphone" | "library" | null;
type CameraMode = "picture" | "video";
type PermissionIssue = "camera" | "microphone" | "library" | null;

const C = {
  bg: "#090909", panel: "#151312", raised: "#1d1a19",
  line: "rgba(255,255,255,0.11)", text: "#f7f0ec", muted: "#aaa09b",
  rose: "#e8b7aa", roseDark: "#281b18", danger: "#e6a09a"
};

function Button({ title, onPress, disabled = false }: {
  title: string; onPress: () => void; disabled?: boolean;
}) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} disabled={disabled}
      style={({ pressed }) => [s.primary, pressed && s.pressed, disabled && s.disabled]}>
      <Text style={s.primaryText}>{title}</Text>
    </Pressable>
  );
}

function PermissionRow({ icon, title, tag, description }: {
  icon: string; title: string; tag: string; description: string;
}) {
  return (
    <View style={s.permissionRow}>
      <View style={s.permissionIcon}><Text style={s.permissionEmoji}>{icon}</Text></View>
      <View style={s.permissionCopy}>
        <View style={s.permissionTitleLine}>
          <Text style={s.permissionTitle}>{title}</Text>
          <Text style={s.permissionTag}>{tag}</Text>
        </View>
        <Text style={s.permissionDescription}>{description}</Text>
      </View>
    </View>
  );
}

export default function App() {
  const cameraRef = useRef<CameraView | null>(null);
  const [cameraPermission, requestCameraPermission, getCameraPermission] = useCameraPermissions();
  const [microphonePermission, requestMicrophonePermission, getMicrophonePermission] =
    useMicrophonePermissions();
  const [libraryPermission, requestLibraryPermission, getLibraryPermission] =
    MediaLibrary.usePermissions({ granularPermissions: ["photo"] });

  const [screen, setScreen] = useState<Screen>("intro");
  const [cameraMode, setCameraMode] = useState<CameraMode>("picture");
  const [facing, setFacing] = useState<CameraType>("front");
  const [cameraReady, setCameraReady] = useState(false);
  const [cameraGranted, setCameraGranted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [optionalPrompt, setOptionalPrompt] = useState<OptionalPrompt>(null);
  const [permissionIssue, setPermissionIssue] = useState<PermissionIssue>(null);
  const [assets, setAssets] = useState<MediaLibrary.Asset[]>([]);
  const [capturedUri, setCapturedUri] = useState<string | null>(null);
  const [notice, setNotice] = useState("");

  const openSettings = async () => {
    try { await Linking.openSettings(); }
    catch { setNotice("Mở Cài đặt thiết bị, chọn THU365 và điều chỉnh quyền tại đó."); }
  };

  const refreshPermissions = useCallback(async () => {
    try {
      const [camera, microphone, library] = await Promise.all([
        getCameraPermission(), getMicrophonePermission(), getLibraryPermission()
      ]);
      setCameraGranted(camera.granted);
      if (camera.granted && permissionIssue === "camera") setPermissionIssue(null);
      if (microphone.granted && permissionIssue === "microphone") setPermissionIssue(null);
      if (library.granted && permissionIssue === "library") setPermissionIssue(null);
      if (!camera.granted && screen === "camera") {
        setCameraReady(false);
        setScreen("intro");
        setPermissionIssue("camera");
      }
      if (!microphone.granted) {
        if (audioEnabled || cameraMode === "video") setPermissionIssue("microphone");
        setAudioEnabled(false);
        if (cameraMode === "video") setCameraMode("picture");
      }
      if (!library.granted && screen === "gallery") {
        setScreen("camera");
        setPermissionIssue("library");
      }
    } catch {
      // A failed status refresh never grants access or blocks unrelated features.
    }
  }, [audioEnabled, cameraMode, getCameraPermission, getLibraryPermission, getMicrophonePermission, permissionIssue, screen]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") void refreshPermissions();
    });
    return () => subscription.remove();
  }, [refreshPermissions]);

  const continueToCamera = async () => {
    setBusy(true);
    setPermissionIssue(null);
    try {
      const current = await getCameraPermission();
      const result = current.granted ? current : await requestCameraPermission();
      if (result.granted) {
        setCameraGranted(true);
        setScreen("camera");
        setCameraMode("picture");
        setCameraReady(false);
        setPermissionIssue(null);
      } else {
        setCameraGranted(false);
        setPermissionIssue("camera");
      }
    } catch {
      setPermissionIssue("camera");
      setNotice("Không thể kiểm tra quyền camera. Hãy thử lại.");
    } finally {
      setBusy(false);
    }
  };

  const enableMicrophone = async () => {
    setBusy(true);
    try {
      const current = await getMicrophonePermission();
      const result = current.granted ? current : await requestMicrophonePermission();
      if (result.granted) {
        setAudioEnabled(true);
        setCameraMode("video");
        setPermissionIssue(null);
        setNotice("Video sẽ ghi âm từ microphone.");
      } else {
        setAudioEnabled(false);
        setCameraMode("picture");
        setPermissionIssue("microphone");
      }
    } catch {
      setPermissionIssue("microphone");
    } finally {
      setOptionalPrompt(null);
      setBusy(false);
    }
  };

  const continueSilentVideo = () => {
    setAudioEnabled(false);
    setCameraMode("video");
    setOptionalPrompt(null);
    setPermissionIssue(null);
    setNotice("Đã chọn quay video không có âm thanh.");
  };

  const openGallery = async () => {
    setBusy(true);
    try {
      const current = await getLibraryPermission();
      const result = current.granted ? current : await requestLibraryPermission();
      if (!result.granted) {
        setPermissionIssue("library");
        return;
      }
      const page = await MediaLibrary.getAssetsAsync({
        first: 24,
        mediaType: MediaLibrary.MediaType.photo,
        sortBy: [MediaLibrary.SortBy.creationTime]
      });
      setAssets(page.assets);
      setScreen("gallery");
      setPermissionIssue(null);
    } catch {
      setPermissionIssue("library");
      setNotice("Không thể mở thư viện ảnh. Camera vẫn dùng được bình thường.");
    } finally {
      setBusy(false);
      setOptionalPrompt(null);
    }
  };

  const takePhoto = async () => {
    if (!cameraRef.current || !cameraReady || busy) return;
    setBusy(true);
    try {
      const result = await cameraRef.current.takePictureAsync({ quality: 0.92 });
      if (result?.uri) setCapturedUri(result.uri);
    } catch {
      setNotice("Chưa thể chụp ảnh. Hãy thử lại.");
    } finally { setBusy(false); }
  };

  const startRecording = async () => {
    if (!cameraRef.current || !cameraReady || busy || recording) return;
    setRecording(true);
    try {
      const result = await cameraRef.current.recordAsync({ maxDuration: 60 });
      if (result?.uri) setCapturedUri(result.uri);
    } catch {
      setNotice("Không thể quay video trên thiết bị này.");
    } finally { setRecording(false); }
  };

  const captureAction = () => {
    if (cameraMode === "picture") void takePhoto();
    else if (recording) cameraRef.current?.stopRecording();
    else void startRecording();
  };

  const retryCamera = async () => {
    if (cameraPermission?.canAskAgain) await continueToCamera();
    else await openSettings();
  };

  const retryOptional = async () => {
    if (permissionIssue === "microphone") {
      if (microphonePermission?.canAskAgain) setOptionalPrompt("microphone");
      else await openSettings();
    } else if (permissionIssue === "library") {
      if (libraryPermission?.canAskAgain) setOptionalPrompt("library");
      else await openSettings();
    }
  };

  const permissionMessage = permissionIssue === "camera"
    ? "Camera chưa được cấp quyền. Bật Camera trong Cài đặt để chụp ảnh. Microphone và thư viện ảnh không cần thiết để mở camera."
    : permissionIssue === "microphone"
      ? "Microphone chưa được cấp. Bạn vẫn có thể quay video im lặng hoặc bật quyền trong Cài đặt."
      : "Chưa có quyền xem thư viện ảnh. Camera vẫn hoạt động; bạn có thể thử lại hoặc đổi quyền trong Cài đặt.";

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="light-content" />
      {screen === "intro" && (
        <ScrollView contentContainerStyle={s.intro}>
          <View style={s.brandRow}>
            <Text style={s.brand}>THU<Text style={s.brandAccent}>365</Text></Text>
            <Text style={s.privacyPill}>✦  RIÊNG TƯ TRƯỚC TIÊN</Text>
          </View>
          <View style={s.hero}>
            <Text style={s.eyebrow}>BẠN LUÔN CÓ QUYỀN CHỌN</Text>
            <Text style={s.heroTitle}>Quyền truy cập,{"\n"}<Text style={s.brandAccent}>lựa chọn của bạn.</Text></Text>
            <Text style={s.body}>
              THU365 giải thích từng quyền trước khi hệ điều hành hiển thị yêu cầu. Camera, microphone và thư viện ảnh được xin riêng theo tính năng bạn chọn.
            </Text>
          </View>
          <View style={s.permissionList}>
            <PermissionRow icon="◉" title="Camera" tag="CẦN CHO CHỤP ẢNH"
              description="Hiển thị khung hình để bạn căn góc, chụp ảnh và quay video." />
            <PermissionRow icon="♫" title="Microphone" tag="TÙY CHỌN"
              description="Chỉ hỏi khi bạn bật quay video có âm thanh. Bỏ qua vẫn quay video im lặng." />
            <PermissionRow icon="▧" title="Thư viện ảnh" tag="TÙY CHỌN"
              description="Chỉ hỏi khi bạn chọn mở ảnh có sẵn để chỉnh sửa." />
          </View>
          <View style={s.privacyNote}>
            <Text style={s.privacyIcon}>⌑</Text>
            <Text style={s.privacyText}>
              Trong luồng này, THU365 không tải ảnh hoặc video lên máy chủ. Bản chụp trả về URI tạm trong bộ nhớ ứng dụng; chưa có chức năng lưu lâu dài hoặc sao lưu đám mây.
            </Text>
          </View>
          {permissionIssue === "camera" && (
            <View style={s.issueCard}>
              <Text style={s.issueText}>{permissionMessage}</Text>
              <Button title={cameraPermission?.canAskAgain ? "THỬ LẠI CAMERA" : "MỞ CÀI ĐẶT"} onPress={() => void retryCamera()} />
            </View>
          )}
          <View style={s.actions}>
            <Button title={busy ? "ĐANG KIỂM TRA…" : "TIẾP TỤC VỚI CAMERA"}
              onPress={() => void continueToCamera()} disabled={busy} />
            <Text style={s.footnote}>Chỉ quyền camera được hỏi ở bước tiếp theo. Mic và thư viện không được yêu cầu lúc khởi động.</Text>
          </View>
        </ScrollView>
      )}

      {screen === "camera" && (
        <View style={s.cameraScreen}>
          <View style={s.cameraHeader}>
            <Text style={s.brand}>THU<Text style={s.brandAccent}>365</Text></Text>
            <Pressable onPress={() => setScreen("intro")}><Text style={s.headerAction}>QUYỀN RIÊNG TƯ</Text></Pressable>
          </View>
          {cameraGranted ? (
            <View style={s.previewWrap}>
              <CameraView ref={cameraRef} style={StyleSheet.absoluteFill}
                facing={facing} mode={cameraMode} mute={!audioEnabled}
                onCameraReady={() => setCameraReady(true)} />
              <View pointerEvents="none" style={s.previewOverlay}>
                <Text style={s.previewLabel}>● CAMERA ĐANG HOẠT ĐỘNG</Text>
                <Text style={s.previewHint}>{audioEnabled ? "VIDEO CÓ ÂM THANH" : "MICROPHONE ĐANG TẮT"}</Text>
              </View>
              {capturedUri ? (
                <View style={s.capturePreview}>
                  <Image source={{ uri: capturedUri }} style={s.captureImage} resizeMode="contain" />
                  <Pressable style={s.closePreview} onPress={() => setCapturedUri(null)}>
                    <Text style={s.headerAction}>ĐÓNG XEM TRƯỚC</Text>
                  </Pressable>
                </View>
              ) : null}
              {!cameraReady && (
                <View style={s.cameraLoading}>
                  <ActivityIndicator color={C.rose} />
                  <Text style={s.muted}>Đang khởi động camera…</Text>
                </View>
              )}
            </View>
          ) : (
            <View style={s.issueCard}>
              <Text style={s.deniedTitle}>Camera chưa được cấp quyền</Text>
              <Text style={s.body}>{permissionMessage}</Text>
              <Button title={cameraPermission?.canAskAgain ? "THỬ LẠI CAMERA" : "MỞ CÀI ĐẶT"} onPress={() => void retryCamera()} />
            </View>
          )}
          {cameraGranted && (
            <>
              <View style={s.controls}>
                <Pressable style={s.sideControl} onPress={() => setOptionalPrompt("library")} disabled={busy}>
                  <Text style={s.controlIcon}>▧</Text><Text style={s.controlLabel}>THƯ VIỆN</Text>
                </Pressable>
                <View style={s.shutterColumn}>
                  <View style={s.modeRow}>
                    <Pressable onPress={() => { setCameraMode("picture"); setAudioEnabled(false); }}>
                      <Text style={cameraMode === "picture" ? s.modeActive : s.mode}>ẢNH</Text>
                    </Pressable>
                    <Pressable onPress={() => setOptionalPrompt("microphone")}>
                      <Text style={cameraMode === "video" ? s.modeActive : s.mode}>VIDEO</Text>
                    </Pressable>
                  </View>
                  <Pressable style={s.shutter} onPress={captureAction} disabled={!cameraReady || busy}>
                    <View style={[s.shutterInner, (cameraMode === "video" || recording) && s.shutterVideo]} />
                  </Pressable>
                  <Text style={s.soundChoice}>{audioEnabled ? "ÂM THANH: BẬT" : "VIDEO IM LẶNG MẶC ĐỊNH"}</Text>
                  {recording && <Pressable onPress={() => cameraRef.current?.stopRecording()} style={s.stopButton}><Text style={s.stopText}>DỪNG QUAY</Text></Pressable>}
                </View>
                <Pressable style={s.sideControl} onPress={() => setFacing((v) => v === "front" ? "back" : "front")}>
                  <Text style={s.controlIcon}>⇄</Text><Text style={s.controlLabel}>ĐỔI CAMERA</Text>
                </Pressable>
              </View>
              <Text style={s.footnote}>Không tải lên · Không lưu tự động · Quyền tùy chọn có thể bỏ qua</Text>
            </>
          )}
        </View>
      )}

      {screen === "gallery" && (
        <View style={s.galleryScreen}>
          <View style={s.cameraHeader}>
            <Pressable onPress={() => setScreen("camera")}><Text style={s.headerAction}>‹  CAMERA</Text></Pressable>
            <Text style={s.galleryTitle}>ẢNH CỦA BẠN</Text>
            <View style={{ width: 70 }} />
          </View>
          <Text style={s.muted}>Chỉ ảnh trong phạm vi quyền bạn đã cấp cho THU365.</Text>
          <ScrollView contentContainerStyle={s.assetGrid}>
            {assets.map((asset) => (
              <Pressable key={asset.id} onPress={() => { setCapturedUri(asset.uri); setScreen("camera"); }} style={s.assetTile}>
                <Image source={{ uri: asset.uri }} style={s.assetImage} />
              </Pressable>
            ))}
          </ScrollView>
          {assets.length === 0 && <Text style={s.muted}>Chưa có ảnh được cấp quyền truy cập.</Text>}
        </View>
      )}

      {permissionIssue && permissionIssue !== "camera" && (
        <View style={s.issueBanner}>
          <Text style={s.issueText}>{permissionMessage}</Text>
          <Pressable onPress={() => void retryOptional()}><Text style={s.issueAction}>THỬ LẠI / CÀI ĐẶT</Text></Pressable>
          <Pressable onPress={() => setPermissionIssue(null)}><Text style={s.dismiss}>ĐÓNG</Text></Pressable>
        </View>
      )}
      {notice ? <View style={s.toast}><Text style={s.toastText}>{notice}</Text></View> : null}

      <Modal transparent animationType="slide" visible={optionalPrompt !== null}
        onRequestClose={() => setOptionalPrompt(null)}>
        <View style={s.modalScrim}>
          <View style={s.modalCard}>
            <Text style={s.eyebrow}>QUYỀN TÙY CHỌN</Text>
            <Text style={s.modalTitle}>
              {optionalPrompt === "microphone" ? "Quay video có âm thanh?" : "Mở ảnh từ thư viện?"}
            </Text>
            <Text style={s.body}>
              {optionalPrompt === "microphone"
                ? "THU365 chỉ cần microphone nếu bạn muốn ghi âm cùng video. Nếu bỏ qua, bạn vẫn có thể quay video im lặng."
                : "THU365 chỉ yêu cầu quyền xem ảnh khi bạn mở thư viện. Bạn có thể bỏ qua và tiếp tục dùng camera."}
            </Text>
            {optionalPrompt === "microphone" ? (
              <>
                <Button title={busy ? "ĐANG KIỂM TRA…" : "CHO PHÉP MICROPHONE"} onPress={() => void enableMicrophone()} disabled={busy} />
                <Pressable style={s.modalSecondary} onPress={continueSilentVideo}>
                  <Text style={s.modalSecondaryText}>QUAY VIDEO KHÔNG ÂM THANH</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Button title={busy ? "ĐANG KIỂM TRA…" : "TIẾP TỤC MỞ THƯ VIỆN"} onPress={() => void openGallery()} disabled={busy} />
                <Pressable style={s.modalSecondary} onPress={() => setOptionalPrompt(null)}>
                  <Text style={s.modalSecondaryText}>BỎ QUA, TIẾP TỤC CAMERA</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  intro: { flexGrow: 1, paddingHorizontal: 22, paddingTop: 18, paddingBottom: 30 },
  brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  brand: { color: C.text, fontSize: 18, fontWeight: "900", letterSpacing: 3 },
  brandAccent: { color: C.rose },
  privacyPill: { color: C.rose, borderWidth: 1, borderColor: C.line, borderRadius: 30, paddingHorizontal: 10, paddingVertical: 7, fontSize: 9, letterSpacing: 1 },
  hero: { marginTop: 48, marginBottom: 26 },
  eyebrow: { color: C.rose, fontSize: 10, fontWeight: "800", letterSpacing: 2 },
  heroTitle: { color: C.text, fontSize: 37, lineHeight: 43, fontWeight: "500", marginTop: 14, letterSpacing: -1.5 },
  body: { color: C.muted, fontSize: 12, lineHeight: 19, marginTop: 11 },
  permissionList: { gap: 10 },
  permissionRow: { flexDirection: "row", alignItems: "center", gap: 13, minHeight: 76, padding: 13, borderRadius: 16, borderWidth: 1, borderColor: C.line, backgroundColor: C.panel },
  permissionIcon: { width: 40, height: 40, borderRadius: 13, backgroundColor: C.roseDark, alignItems: "center", justifyContent: "center" },
  permissionEmoji: { color: C.rose, fontSize: 19 },
  permissionCopy: { flex: 1 },
  permissionTitleLine: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 8 },
  permissionTitle: { color: C.text, fontSize: 14, fontWeight: "700" },
  permissionTag: { color: C.rose, fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  permissionDescription: { color: C.muted, fontSize: 10, lineHeight: 15, marginTop: 5 },
  privacyNote: { flexDirection: "row", gap: 9, marginTop: 17, padding: 12, borderRadius: 13, backgroundColor: C.raised },
  privacyIcon: { color: C.rose, fontSize: 17 },
  privacyText: { color: C.muted, flex: 1, fontSize: 9, lineHeight: 14 },
  actions: { marginTop: "auto", paddingTop: 22 },
  primary: { minHeight: 49, borderRadius: 14, backgroundColor: C.rose, alignItems: "center", justifyContent: "center", paddingHorizontal: 18 },
  primaryText: { color: "#211714", fontSize: 11, fontWeight: "900", letterSpacing: 0.7 },
  pressed: { opacity: 0.8, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.5 },
  footnote: { color: "#77716f", fontSize: 9, lineHeight: 14, textAlign: "center", marginTop: 11 },
  cameraScreen: { flex: 1, paddingHorizontal: 16, paddingTop: 8, paddingBottom: 12 },
  cameraHeader: { height: 42, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerAction: { color: C.rose, fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  previewWrap: { flex: 1, marginTop: 10, borderRadius: 24, overflow: "hidden", backgroundColor: "#171514", minHeight: 300 },
  previewOverlay: { position: "absolute", top: 16, left: 14, right: 14, gap: 8 },
  previewLabel: { alignSelf: "flex-start", color: C.text, backgroundColor: "rgba(0,0,0,.48)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7, fontSize: 8, fontWeight: "800", letterSpacing: 1 },
  previewHint: { alignSelf: "flex-start", color: C.rose, backgroundColor: "rgba(0,0,0,.48)", borderRadius: 20, paddingHorizontal: 10, paddingVertical: 7, fontSize: 8, letterSpacing: 1 },
  cameraLoading: { ...StyleSheet.absoluteFill, alignItems: "center", justifyContent: "center", gap: 10, backgroundColor: "#171514" },
  muted: { color: C.muted, fontSize: 10, lineHeight: 16 },
  capturePreview: { ...StyleSheet.absoluteFill, backgroundColor: "#090909", alignItems: "center", justifyContent: "center" },
  captureImage: { width: "100%", height: "88%" },
  closePreview: { padding: 12 },
  issueCard: { flex: 1, justifyContent: "center", gap: 15, padding: 18, borderRadius: 18, borderWidth: 1, borderColor: C.line, backgroundColor: C.panel },
  deniedTitle: { color: C.text, fontSize: 23, fontWeight: "700" },
  controls: { minHeight: 150, flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingTop: 13 },
  sideControl: { alignItems: "center", justifyContent: "center", width: 76, gap: 6 },
  controlIcon: { color: C.rose, fontSize: 26 },
  controlLabel: { color: C.muted, fontSize: 8, fontWeight: "700", letterSpacing: 0.5 },
  shutterColumn: { alignItems: "center", gap: 9 },
  modeRow: { flexDirection: "row", gap: 22 },
  mode: { color: C.muted, fontSize: 10, fontWeight: "700", letterSpacing: 1 },
  modeActive: { color: C.rose, fontSize: 10, fontWeight: "900", letterSpacing: 1 },
  shutter: { width: 72, height: 72, borderRadius: 36, borderWidth: 3, borderColor: "#fff", alignItems: "center", justifyContent: "center" },
  shutterInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: C.text },
  shutterVideo: { width: 26, height: 26, borderRadius: 7, backgroundColor: "#d98f7c" },
  soundChoice: { color: C.muted, fontSize: 8, letterSpacing: 0.5 },
  stopButton: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: "#51231f" },
  stopText: { color: "#fff", fontSize: 9, fontWeight: "800" },
  galleryScreen: { flex: 1, paddingHorizontal: 18, paddingTop: 8 },
  galleryTitle: { color: C.text, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  assetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingVertical: 16 },
  assetTile: { width: "31.8%", aspectRatio: 1, borderRadius: 10, overflow: "hidden", backgroundColor: C.panel },
  assetImage: { width: "100%", height: "100%" },
  issueBanner: { position: "absolute", left: 12, right: 12, bottom: 12, backgroundColor: "#241918", borderColor: "#71443d", borderWidth: 1, borderRadius: 14, padding: 12, gap: 8 },
  issueText: { color: "#f0d4cd", fontSize: 10, lineHeight: 15 },
  issueAction: { color: C.rose, fontSize: 9, fontWeight: "900", letterSpacing: 1 },
  dismiss: { color: C.muted, fontSize: 8, fontWeight: "800", alignSelf: "flex-end" },
  toast: { position: "absolute", bottom: 24, alignSelf: "center", maxWidth: "90%", backgroundColor: C.raised, borderWidth: 1, borderColor: C.line, borderRadius: 20, paddingHorizontal: 15, paddingVertical: 10 },
  toastText: { color: C.text, fontSize: 10 },
  modalScrim: { flex: 1, backgroundColor: "rgba(0,0,0,0.72)", justifyContent: "flex-end" },
  modalCard: { backgroundColor: C.panel, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 22, paddingBottom: 34, borderWidth: 1, borderColor: C.line, gap: 12 },
  modalTitle: { color: C.text, fontSize: 23, fontWeight: "700" },
  modalSecondary: { minHeight: 42, alignItems: "center", justifyContent: "center" },
  modalSecondaryText: { color: C.muted, fontSize: 9, fontWeight: "800", letterSpacing: 1 }
});
