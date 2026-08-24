/**
 * Fontes de imagem de personagens (§7 do plano). Nenhuma é oficial —
 * todas são projetos da comunidade. Mantidas centralizadas aqui pra trocar
 * rápido se alguma sair do ar (aconteceu com api.genshin.dev em 2026-08,
 * por isso Genshin usa o Enka.Network como fonte primária).
 */

// Genshin: ícones da UI do jogo, servidos pelo Enka.Network.
// Codinome interno do personagem (ex: "Qin" para Jean, "Mizuki" para Yumemizuki Mizuki).
export function urlIconeGenshin(codinome: string): string {
  return `https://enka.network/ui/UI_AvatarIcon_${codinome}.png`;
}

// HSR: ícones servidos pelo repositório Mar-7th/StarRailRes via raw.githubusercontent.
export function urlIconeHsr(avatarId: string): string {
  return `https://raw.githubusercontent.com/Mar-7th/StarRailRes/master/icon/character/${avatarId}.png`;
}
