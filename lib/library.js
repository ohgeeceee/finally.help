// The starter explainer library — written in the finally.help engine voice.
// Single source of truth: served to the browser via /api/library and used
// server-side to build quiz questions in /api/game.

export const LIBRARY = [
  { id: "mortgage", cat: "Money", title: "How a mortgage works", analogy: "🧱 LEGO castle on allowance",
    teaser: "The bank buys the house today; you pay it back in slices.",
    body: `Imagine you want a $300 LEGO castle but you only have $30. The bank buys the castle for you, and you promise to pay them back a little every week from your allowance.

A **mortgage** (a long loan used to buy a home) is that promise, but for a house. The bank hands over the full price so you can move in today.

Every month you pay back a slice of what you borrowed, plus a little extra called **interest** (a rental fee for using the bank's money).

Here's the catch: until you've paid it all off, the bank still holds the deed — so if you stop paying, they can take the house back. And the longer you take, the more interest you hand over, so a house can quietly cost far more than its sticker price.

> A mortgage lets you live in a house today by borrowing the price and paying it back in small monthly slices, with a fee for the wait.` },

  { id: "inflation", cat: "Money", title: "What inflation is", analogy: "🍫 Shrinking candy bar",
    teaser: "Same candy bar, smaller dollar.",
    body: `Last year, $1 bought you a full candy bar. This year that same $1 only gets you three-quarters of it. Nothing changed about the candy — your dollar just shrank.

That's **inflation** (when prices slowly rise, so each dollar buys a little less than before).

Picture the whole town suddenly having more money in their pockets. Everyone rushes to buy candy, but there are only so many bars on the shelf. The shopkeeper notices the crowd and nudges the price up, because people will still pay.

Multiply that across food, gas, rent, and haircuts, and life gets more expensive even when your paycheck stays the same. A little is normal and healthy; too much, too fast, is when your money feels like it's melting in your hand.

> Inflation is your money quietly buying less over time, usually because there's more money chasing the same amount of stuff.` },

  { id: "api", cat: "Tech", title: "What an API is", analogy: "🍽️ Restaurant waiter",
    teaser: "A waiter between your app and a kitchen you can't enter.",
    body: `Think of a restaurant. You sit at your table (an app on your phone) and you're hungry, but you're not allowed into the kitchen where the food is made. So how do you get a meal? A **waiter**.

An **API** (a messenger that carries your request to a system and brings back the answer) is that waiter. You don't need to know how the kitchen works.

You just pick from the menu — "I'd like today's weather" — and hand your order to the waiter. The waiter walks into the kitchen (another company's computers), grabs exactly what you asked for, and brings it back to your table.

When your weather app shows the forecast, or you tap "Sign in with Google," an API just took your order and returned the dish.

> An API is a waiter that carries your request to a kitchen you're not allowed to enter, and brings back exactly what you asked for.` },

  { id: "tariffs", cat: "Money", title: "How tariffs work", analogy: "🍋 Lemonade street rule",
    teaser: "A street rule that makes the other kid's lemonade pricier.",
    body: `Imagine two lemonade stands on the same street: yours, and one run by a kid from the next block. His lemonade is cheaper, so everyone buys from him.

To help you out, your mom makes a rule: any kid from another block has to pay her $1 for every cup they sell on your street. A **tariff** (a tax a country puts on goods coming in from abroad) is that rule.

To cover the $1, the other kid raises his price. Now his lemonade costs the same as yours, or more, so customers come back to you. That's the point — tariffs make foreign stuff pricier so home-grown stuff can compete.

The catch? Customers are now paying more for lemonade either way.

> A tariff is a tax on imported goods that helps local sellers compete, but quietly raises prices for everyone who buys.` },

  { id: "credit-score", cat: "Money", title: "What a credit score is", analogy: "🎮 Returning borrowed games",
    teaser: "Your reputation for paying people back, as one number.",
    body: `Imagine that every time you borrowed a friend's video game, a classmate wrote down whether you gave it back on time and in good shape. After a while, that classmate can tell anyone, "This person always returns things — trust them."

A **credit score** (a number, roughly 300 to 850, that rates how reliably you repay money) is that reputation.

Every time you borrow — a card, a car, a phone plan — and pay on time, your number ticks up. Miss payments, or max out every card, and it drops.

When you later want a big loan, the bank peeks at this number to decide whether to trust you, and how much extra to charge you. A high score isn't about being rich — it's about being reliable.

> A credit score is a trust rating built from your history of borrowing and repaying, and lenders use it to decide if you're safe to lend to.` },

  { id: "stock-market", cat: "Money", title: "How the stock market works", analogy: "🍋 Slices of a lemonade stand",
    teaser: "Trading tiny slices of companies all day long.",
    body: `Imagine a lemonade stand so popular the owner says, "I'll sell tiny slices of my stand so I can buy more lemons." You buy one slice for $1. Now you own a piece of the business.

A **share** of **stock** (a small piece of ownership in a company) is that slice.

If the stand starts selling twice as much lemonade, everyone wants a slice, so your $1 piece might sell for $2. If a rumor spreads that the lemons taste sour, people rush to sell, and your slice drops to 50 cents.

The **stock market** is just the giant playground where thousands of people trade these slices all day, and prices bounce around based on how hopeful or nervous everyone feels.

> The stock market is a huge trading ground for tiny slices of companies, where prices rise and fall based on how much people want in.` },

  { id: "vpn", cat: "Tech", title: "What a VPN is", analogy: "✉️ Locked box for notes",
    teaser: "A locked box for the notes you pass around the internet.",
    body: `Imagine passing notes in class. Normally, anyone who intercepts your note can read it and see exactly who it's going to.

A **VPN** (a private, sealed tunnel for your internet traffic) is like sliding your note into a locked box that only your friend can open, then handing it to a trusted courier.

Now if a nosy classmate grabs it, all they see is a locked box — not the message, and not even who it's really for.

That courier can also fetch notes for you from across the school, so it looks like you're sitting somewhere you're not. That's why people use a VPN on public wifi, or to reach sites blocked in their area.

> A VPN wraps your internet activity in a locked, private tunnel so snoops can't read it or tell where it's really going.` },

  { id: "cholesterol", cat: "Health", title: "What cholesterol is", analogy: "🚚 Litter & cleanup trucks",
    teaser: "Two delivery trucks in your blood — one litters, one cleans.",
    body: `Your blood is like a network of tiny delivery roads, and cholesterol is a waxy package your body actually needs to build cells. The trouble is there are two kinds of delivery trucks.

**LDL** (the "lazy" truck that drops packages along the road) leaves waxy gunk stuck to your artery walls. Over years, that gunk piles up like grease in a pipe, narrowing the road until blood can barely get through.

**HDL** (the "helpful" truck) drives around picking up the dropped packages and hauling them away to be recycled.

So you want lots of the helpful trucks and few of the lazy ones. "High cholesterol" usually means too many lazy trucks littering your pipes.

> Cholesterol is waxy cargo in your blood — one truck litters your arteries and clogs them, the other cleans up, and you want more cleaners than litterers.` },
];

export function libraryItem(id) {
  return LIBRARY.find((x) => x.id === id) || null;
}
