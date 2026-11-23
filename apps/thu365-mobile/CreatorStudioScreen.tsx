import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";

export function CreatorStudioScreen({ onBack }: { onBack: () => void }) {
  const [filter, setFilter] = useState("ORIGINAL");
  const [clip, setClip] = useState(0);
  const [sound, setSound] = useState("ORIGINAL AUDIO");
  const [caption, setCaption] = useState("A little moment");
  const [sticker, setSticker] = useState("NONE");
  const [notice, setNotice] = useState("");
  const filters = ["ORIGINAL", "SOFT GLOW", "K-FILM", "VINTAGE", "ANIME"];
  return (
    <ScrollView style={s.root} contentContainerStyle={s.page}>
      <View style={s.header}>
        <Pressable onPress={onBack}><Text style={s.accent}>‹ BACK</Text></Pressable>
        <View><Text style={s.title}>CREATOR STUDIO</Text><Text style={s.meta}>PROJECT 001 · LOCAL DRAFT</Text></View>
        <Text style={s.meta}>9:16</Text>
      </View>
      <View style={s.preview}>
        <Text style={s.kicker}>THU365 / VIDEO EDITOR</Text>
        <Text style={s.headline}>CREATE YOUR{"\n"}MOMENT.</Text>
        <Text style={s.caption}>{caption || "ADD YOUR STORY"}</Text>
        {sticker !== "NONE" ? <Text style={s.sticker}>{sticker}</Text> : null}
        <Text style={s.previewTag}>PREVIEW · {filter}</Text>
      </View>
      <View style={s.section}><Text style={s.sectionTitle}>01 / FILTERS</Text><Text style={s.meta}>LIVE PREVIEW MOCK</Text></View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips}>
        {filters.map((item) => <Pressable key={item} onPress={() => setFilter(item)} style={[s.chip, filter === item && s.active]}><Text style={[s.chipText, filter === item && s.activeText]}>{item}</Text></Pressable>)}
      </ScrollView>
      <View style={s.section}><Text style={s.sectionTitle}>02 / TIMELINE</Text><Text style={s.meta}>00:12 · 3 CLIPS</Text></View>
      <View style={s.timeline}>{[0, 1, 2].map((item) => <Pressable key={item} onPress={() => setClip(item)} style={[s.clip, clip === item && s.active]}><Text style={s.accent}>0{item + 1}</Text><Text style={s.clipName}>{["INTRO", "PORTRAIT", "OUTRO"][item]}</Text><Text style={s.meta}>00:04</Text></Pressable>)}</View>
      <View style={s.section}><Text style={s.sectionTitle}>03 / SOUND & STORY</Text><Text style={s.meta}>LOCAL ONLY</Text></View>
      <Pressable style={s.sound} onPress={() => setSound((v) => v === "ORIGINAL AUDIO" ? "SOFT PIANO DEMO" : "ORIGINAL AUDIO")}><Text style={s.accent}>♫</Text><View style={{ flex: 1 }}><Text style={s.clipName}>{sound}</Text><Text style={s.meta}>Tap to switch demo audio label</Text></View><Text style={s.accent}>CHANGE ↗</Text></Pressable>
      <TextInput value={caption} onChangeText={setCaption} maxLength={100} placeholder="Write a caption…" placeholderTextColor="#777" style={s.input} />
      <View style={s.chips}>{["NONE", "✦ GLOW", "♡ LOVE"].map((item) => <Pressable key={item} onPress={() => setSticker(item)} style={[s.chip, sticker === item && s.active]}><Text style={[s.chipText, sticker === item && s.activeText]}>{item}</Text></Pressable>)}</View>
      <Pressable style={s.export} onPress={() => setNotice("Prototype only: native video rendering/export is not connected.")}><Text style={s.exportText}>REVIEW EXPORT / 1080 × 1920</Text></Pressable>
      {notice ? <Text style={s.notice}>{notice}</Text> : null}
      <Text style={s.disclaimer}>INTERACTIVE UI PROTOTYPE · NO MEDIA UPLOAD · NO VIDEO FILE GENERATED</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#050505" }, page: { padding: 16, paddingTop: 12, paddingBottom: 30, gap: 12 },
  header: { minHeight: 48, flexDirection: "row", justifyContent: "space-between", alignItems: "center", borderBottomWidth: 1, borderBottomColor: "#292929", paddingBottom: 9 },
  accent: { color: "#d9f26b", fontSize: 10, fontWeight: "900", letterSpacing: 1 }, title: { color: "#f5f5f5", fontSize: 12, fontWeight: "900", letterSpacing: 1.2, textAlign: "center" }, meta: { color: "#858585", fontSize: 8, letterSpacing: 0.7 },
  preview: { width: "100%", aspectRatio: 9 / 13, maxHeight: 410, alignSelf: "center", backgroundColor: "#101010", borderWidth: 1, borderColor: "#393939", alignItems: "center", justifyContent: "center", padding: 20 },
  kicker: { color: "#d9f26b", fontSize: 8, letterSpacing: 2, marginBottom: 18 }, headline: { color: "#f5f5f5", fontSize: 30, lineHeight: 34, fontWeight: "900", letterSpacing: -1, textAlign: "center" }, caption: { color: "#d9f26b", fontSize: 10, marginTop: 22, letterSpacing: 1 }, sticker: { color: "#fff", fontSize: 18, marginTop: 14 }, previewTag: { position: "absolute", top: 10, left: 10, color: "#d9f26b", fontSize: 8, borderWidth: 1, borderColor: "#555", padding: 6 },
  section: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 6 }, sectionTitle: { color: "#f5f5f5", fontSize: 10, fontWeight: "900", letterSpacing: 1 }, chips: { flexDirection: "row", gap: 7, paddingVertical: 3 },
  chip: { borderWidth: 1, borderColor: "#383838", backgroundColor: "#0b0b0b", paddingHorizontal: 11, minHeight: 34, justifyContent: "center" }, active: { borderColor: "#d9f26b", backgroundColor: "#171d0b" }, chipText: { color: "#aaa", fontSize: 8, fontWeight: "800", letterSpacing: 0.6 }, activeText: { color: "#d9f26b" },
  timeline: { flexDirection: "row", gap: 6 }, clip: { flex: 1, minHeight: 68, borderWidth: 1, borderColor: "#383838", backgroundColor: "#0b0b0b", padding: 8, justifyContent: "space-between" }, clipName: { color: "#f2f2f2", fontSize: 8, fontWeight: "800" },
  sound: { minHeight: 52, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1, borderColor: "#292929", backgroundColor: "#0b0b0b", padding: 10 }, input: { minHeight: 44, borderWidth: 1, borderColor: "#383838", backgroundColor: "#0b0b0b", color: "#f5f5f5", paddingHorizontal: 11, fontSize: 10 },
  export: { minHeight: 48, backgroundColor: "#d9f26b", alignItems: "center", justifyContent: "center", marginTop: 4 }, exportText: { color: "#080808", fontSize: 10, fontWeight: "900", letterSpacing: 0.8 }, notice: { color: "#d9f26b", fontSize: 9, lineHeight: 14 }, disclaimer: { color: "#777", fontSize: 7, letterSpacing: 0.7, textAlign: "center", marginTop: 4 }
});
