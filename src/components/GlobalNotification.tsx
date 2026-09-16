"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function GlobalNotification({ permissions }: { permissions?: string[] }) {
  const supabase = createClient();

  useEffect(() => {
    // Hanya aktifkan notifikasi global untuk Kasir (pos) atau Dapur (kds)
    const hasAccess = permissions?.includes("pos") || permissions?.includes("kds");
    if (!hasAccess) return;

    // Fungsi untuk membunyikan suara (Voice TTS)
    const playVoiceNotification = () => {
      try {
        if ('speechSynthesis' in window) {
          if (window.speechSynthesis.speaking) return; 

          const msg = new SpeechSynthesisUtterance("Ada pesanan baru nih, mohon segera dicek ya.");
          msg.lang = 'id-ID'; 
          
          const voices = window.speechSynthesis.getVoices();
          if (voices.length > 0) {
            const idVoices = voices.filter(v => v.lang.toLowerCase().includes('id'));
            let femaleVoice = idVoices.find(v => 
              v.name.toLowerCase().match(/female|wanita|perempuan|gadis|damayanti|siti|ayu/i) ||
              v.voiceURI.toLowerCase().match(/female/i)
            );
            if (!femaleVoice && idVoices.length > 1) {
              femaleVoice = idVoices.find(v => !v.name.toLowerCase().match(/andika|male|pria/i));
            }
            if (femaleVoice) {
              msg.voice = femaleVoice;
            }
          }

          msg.rate = 1.0;
          msg.pitch = 1.15;
          window.speechSynthesis.speak(msg);
        }
      } catch (e) {
        console.error("Voice play error: ", e);
      }
    };

    const channel = supabase
      .channel('global_orders_channel')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          setTimeout(() => {
            playVoiceNotification();
          }, 500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [permissions, supabase]);

  return null;
}
