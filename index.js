// 遊戲狀態
const GAME_STATE = {
  FirstCardAwaits: 'FirstCardAwaits',
  SecondCardAwaits: 'SecondCardAwaits',
  CardsMatchFailed: 'CardsMatchFailed',
  CardsMathced: 'CardsMathced',
  GameFinished: 'GameFinished'
}

// 處理花色的圖檔
const Symbols = [
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17989/__.png', // 黑桃
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17992/heart.png', // 愛心
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17991/diamonds.png', // 方塊
  'https://assets-lighthouse.alphacamp.co/uploads/image/file/17988/__.png' //
]
// 產生0-51的數字陣列
// 0-12：黑桃 1-13
// 13 - 25：愛心 1 - 13
// 26 - 38：方塊 1 - 13
// 39 - 51：梅花 1 - 13


const view = {
  // 取得牌背
  getCardElement(index) {
    return `<div class="card back" data-index = "${index}"></div>`
  },
  // 取得牌面: 負責生成卡片內容，包括花色和數字 --> 點即時顯示
  getCardContent(index) {
    const number = this.transformNumber((index % 13) + 1)
    const symbol = Symbols[Math.floor(index / 13)]
    return `
      <p>${number}</p>
      <img src="${symbol}" alt="">
      <p>${number}</p>
    `
  },
  // 特殊數字轉換 1, 11, 12, 13 <--> A, J, Q, K
  transformNumber(number) {
    switch (number) {
      case 1:
        return 'A'
      case 11:
        return 'J'
      case 12:
        return 'Q'
      case 13:
        return 'K'
      default:
        return number
    }
  },
  // 負責選出 #cards 並抽換內容
  displayCards(indexes) {
    const rootElement = document.querySelector('#cards');
    rootElement.innerHTML = indexes.map(index => this.getCardElement(index)).join("");
  },
  // 翻牌
  flipCards(...cards) {
    cards.map(card => {
      if (card.classList.contains('back')) {
        // 回傳正面
        card.classList.remove('back')
        card.innerHTML = this.getCardContent(Number(card.dataset.index))
        return
      }
      // 回傳背面
      card.classList.add('back');
      card.innerHTML = null
    })
  },

  // 配對成功畫面變化
  pairCards(...cards) {
    cards.map(card => {
      card.classList.add('paired')
    })
  },
  // 顯示分數
  renderScore(score) {
    document.querySelector(".score").textContent = `Score: ${score}`
  },
  // 顯示次數
  renderTriedTimes(times) {
    document.querySelector(".tried").textContent = `You've tried: ${times} times`
  },
  // 配對錯誤顯示動畫
  appendWrongAnimation(...cards) {
    cards.map(card => {
      card.classList.add('wrong')
      card.addEventListener('animationend', event => {
        event.target.classList.remove('wrong', { once: true }) // 執行一次後卸載監聽器
      })
    })
  },
  // 遊戲結束
  showGameFinished() {
    const div = document.createElement('div');
    div.classList.add('completed');
    div.innerHTML = `
      <p>Complete!</p>
      <p>Score: ${model.score}</p>
      <p>You've tried: ${model.triedTimes} times</p>
    `
    const header = document.querySelector('#header');
    header.before(div)
  }
}

const utility = {
  // 洗牌演算法 Fisher-Yates Shuffle
  getRandomNumberArray(count) {
    const number = Array.from(Array(count).keys())
    for (let index = number.length - 1; index > 0; index--) {
      let randomIndex = Math.floor(Math.random() * (index + 1));
      [number[index], number[randomIndex]] = [number[randomIndex], number[index]]
    }
    return number
  }
}


const model = {
  revealedCards: [],

  isRevealedCardsMathced() {
    return this.revealedCards[0].dataset.index % 13 === this.revealedCards[1].dataset.index % 13
  },

  score: 0,
  triedTimes: 0
}

const controller = {
  // 目前狀態
  currentState: GAME_STATE.FirstCardAwaits,

  // 發牌
  generateCards() {
    view.displayCards(utility.getRandomNumberArray(52))
  },

  // 依照不同遊戲狀態做不同行為
  dispatchCardAction(card) {
    if (!card.classList.contains('back')) {
      return
    }

    switch (this.currentState) {
      case GAME_STATE.FirstCardAwaits:
        view.flipCards(card)
        model.revealedCards.push(card)
        this.currentState = GAME_STATE.SecondCardAwaits
        break

      case GAME_STATE.SecondCardAwaits:
        // 嘗試次數+1
        view.renderTriedTimes(++model.triedTimes) // ++作為前綴，會先進行遞增，在將遞增後的結果回傳
        view.flipCards(card)
        model.revealedCards.push(card)
        console.log(model.isRevealedCardsMathced())
        if (model.isRevealedCardsMathced()) {
          // 配對成功
          // 獲得10分
          view.renderScore(model.score += 10)
          this.currentState = GAME_STATE.CardsMathced
          // 更改CSS狀態
          view.pairCards(...model.revealedCards)
          // 清空陣列
          model.revealedCards = []
          // 遊戲結束
          if (model.score === 260) {
            console.log('showGameFinished');
            this.currentState = GAME_STATE.GameFinished
            view.showGameFinished()
            return
          }
          // 回到起始狀態
          this.currentState = GAME_STATE.FirstCardAwaits
        } else {
          // 配對失敗
          this.currentState = GAME_STATE.CardsMatchFailed
          // 加入失敗動畫
          view.appendWrongAnimation(...model.revealedCards)
          // 翻回背面時間延遲
          setTimeout(this.resetCards, 1000)
        }
        break
    }
    console.log('current state:', this.currentState)
    console.log('reveal card: ', model.revealedCards)
  },
  // 翻回背面時間延遲
  resetCards() {
    view.flipCards(...model.revealedCards)
    // 清空陣列
    model.revealedCards = []
    controller.currentState = GAME_STATE.FirstCardAwaits
  }

}

controller.generateCards()

document.querySelectorAll('.card').forEach(card => {
  card.addEventListener('click', (event) => {
    controller.dispatchCardAction(card)
  })
})