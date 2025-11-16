///////////////////////
// INÍCIO BLACK FRIDAY
// Config global de promoção
///////////////////////

window.PROMO = {
  active: true,              // ligar/desligar promo
  discountPercentage: 20,    // Esquenta Black Friday (20%)
  freeShipping: false        // Esquenta não tem frete grátis
};

// No dia 28 troque para:
// window.PROMO = { active: true, discountPercentage: 30, freeShipping: true };

///////////////////////
// FIM BLACK FRIDAY
///////////////////////

// =======================
// Função global de desconto
// =======================
window.aplicarDesconto = function (preco) {
  if (!window.PROMO || !window.PROMO.active) return preco;
  const final = preco * (1 - window.PROMO.discountPercentage / 100);
  return Number(final.toFixed(2));
};
