import { supabase } from '@/lib/supabase'

export interface AIResponse {
  answer: string
  error?: string
}

const N8N_WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://codeicon.app.n8n.cloud/webhook/ai-assistant'

export const aiService = {
  /**
   * Yapay zeka asistanına soru gönderir
   * Güvenlik için kullanıcının oturum bilgilerini (Token, ID, Rol, Firma) arka planda otomatik ekler.
   */
  async askQuestion(question: string): Promise<string> {
    try {
      // 1. Mevcut kullanıcı oturumunu al
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Yapay zeka asistanını kullanmak için giriş yapmalısınız.')
      }

      // Kullanıcının profil bilgilerini çek (Firma ID ve Rol tespiti için)
      // Tablo adınız users veya profiles olabilir. 'profiles' olarak varsayıyoruz.
      // Eğer farklıysa burayı güncellemek gerekebilir.
      const { data: profile } = await supabase
        .from('users') // Veya profiles
        .select('role, company_id')
        .eq('id', session.user.id)
        .single()

      const payload = {
        question,
        context: {
          userId: session.user.id,
          userEmail: session.user.email,
          role: profile?.role || 'user',
          companyId: profile?.company_id || null,
          token: session.access_token // n8n'in Supabase'e bu kullanıcı adına bağlanması için
        }
      }

      // 2. n8n Webhook'una veriyi gönder
      const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) {
        throw new Error('Yapay zeka servisi şu anda yanıt veremiyor.')
      }

      const textResponse = await response.text()
      console.log('N8N RAW RESPONSE:', textResponse)
      
      if (!textResponse || textResponse.trim() === '') {
        return 'HATA: Yapay zeka boş bir yanıt döndürdü (n8n Webhook ayarlarını kontrol edin).'
      }

      try {
        const data = JSON.parse(textResponse)
        console.log('N8N PARSED DATA:', data)
        const finalAnswer = data.output || data.answer || data.text || textResponse
        return finalAnswer.trim() === '' ? 'HATA: JSON okundu ama cevap kısmı boş geldi.' : finalAnswer
      } catch (e) {
        // Eğer JSON formatında dönmediyse, düz metin olarak dönmüştür
        return textResponse.trim() === '' ? 'HATA: Metin boş geldi.' : textResponse
      }
    } catch (error: any) {
      console.error('AI Service Error:', error)
      return `Hata: ${error.message || 'Bilinmeyen bir hata oluştu.'}`
    }
  }
}
