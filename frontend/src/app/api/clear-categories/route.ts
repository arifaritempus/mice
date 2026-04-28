import { NextResponse } from 'next/server';

export async function POST() {
  try {
    // Bu endpoint sadece development için
    return NextResponse.json({ 
      message: 'localStorage temizlenmek için kategoriler sayfasına gidin ve sayfayı yenileyin' 
    });
  } catch (error) {
    return NextResponse.json({ error: 'Hata oluştu' }, { status: 500 });
  }
}


