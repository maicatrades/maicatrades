"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

type Direction = "long" | "short";

export default function PositionSizeCalculator() {
  const [direction, setDirection] = useState<Direction>("long");
  const [account, setAccount] = useState("10000");
  const [risk, setRisk] = useState("1");
  const [entry, setEntry] = useState("");
  const [stop, setStop] = useState("");
  const [target, setTarget] = useState("");
  const [copied, setCopied] = useState(false);

  const result = useMemo(() => {
    const accountValue = Number(account) || 0;
    const riskPercent = Number(risk) || 0;
    const entryPrice = Number(entry) || 0;
    const stopPrice = Number(stop) || 0;
    const targetPrice = Number(target) || 0;

    const dollarRiskGoal = accountValue * (riskPercent / 100);
    const riskPerShare = Math.abs(entryPrice - stopPrice);

    const riskBasedShares =
      riskPerShare > 0 ? Math.floor(dollarRiskGoal / riskPerShare) : 0;

    const maxAffordableShares =
      entryPrice > 0 ? Math.floor(accountValue / entryPrice) : 0;

    const exceedsBuyingPower =
      riskBasedShares > maxAffordableShares && maxAffordableShares > 0;

    const sharesToBuy = exceedsBuyingPower
      ? maxAffordableShares
      : riskBasedShares;

    const capitalRequired = riskBasedShares * entryPrice;
    const capitalUsed = sharesToBuy * entryPrice;
    const actualRisk = sharesToBuy * riskPerShare;

    const actualRiskPercent =
      accountValue > 0 ? (actualRisk / accountValue) * 100 : 0;

    const buyingPowerUsed =
      accountValue > 0 ? (capitalUsed / accountValue) * 100 : 0;

    const rewardPerShare =
      targetPrice > 0
        ? direction === "long"
          ? targetPrice - entryPrice
          : entryPrice - targetPrice
        : 0;

    const potentialProfitLoss = sharesToBuy * rewardPerShare;
    const validRewardPerShare = Math.max(rewardPerShare, 0);

    const rr =
      actualRisk > 0 && validRewardPerShare > 0
        ? (sharesToBuy * validRewardPerShare) / actualRisk
        : 0;

    const validTarget =
      targetPrice > 0
        ? direction === "long"
          ? targetPrice > entryPrice
          : targetPrice < entryPrice
        : false;

    const nearMaxBuyingPower = buyingPowerUsed >= 90 && buyingPowerUsed <= 100;

    const grade =
      exceedsBuyingPower || !validTarget
        ? "D"
        : rr >= 3 && buyingPowerUsed < 80
        ? "A+"
        : rr >= 2
        ? "A"
        : rr >= 1
        ? "B"
        : "C";

    const rating =
      grade === "A+"
        ? "Excellent Setup"
        : grade === "A"
        ? "Good Setup"
        : grade === "B"
        ? "Fair Setup"
        : grade === "C"
        ? "Weak Setup"
        : "Needs Review";

    return {
      accountValue,
      riskPercent,
      entryPrice,
      stopPrice,
      targetPrice,
      dollarRiskGoal,
      riskPerShare,
      riskBasedShares,
      maxAffordableShares,
      exceedsBuyingPower,
      sharesToBuy,
      capitalRequired,
      capitalUsed,
      actualRisk,
      actualRiskPercent,
      buyingPowerUsed,
      rewardPerShare,
      potentialProfitLoss,
      rr,
      validTarget,
      nearMaxBuyingPower,
      grade,
      rating,
    };
  }, [account, risk, entry, stop, target, direction]);

  function resetCalculator() {
    setDirection("long");
    setAccount("10000");
    setRisk("1");
    setEntry("");
    setStop("");
    setTarget("");
    setCopied(false);
  }

  async function copySetup() {
    const text = `
MaicaTrades Position Size

Direction: ${direction.toUpperCase()}
Account: ${money(result.accountValue)}
Risk Goal: ${result.riskPercent}%
Entry: ${money(result.entryPrice)}
Stop: ${money(result.stopPrice)}
Target: ${result.targetPrice ? money(result.targetPrice) : "Not set"}

Shares to Buy: ${result.sharesToBuy.toLocaleString()}
Risk-Based Shares: ${result.riskBasedShares.toLocaleString()}
Capital Required: ${money(result.capitalRequired)}
Capital Used: ${money(result.capitalUsed)}
Max Loss: ${money(result.actualRisk)}
Actual Risk: ${result.actualRiskPercent.toFixed(2)}%
Potential P/L: ${money(result.potentialProfitLoss)}
Risk/Reward: ${result.rr ? `${result.rr.toFixed(2)}R` : "N/A"}
Buying Power: ${result.buyingPowerUsed.toFixed(1)}%
Trade Grade: ${result.grade}
`.trim();

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <main className="min-h-screen bg-black px-6 py-10 text-white">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-emerald-400 transition hover:text-emerald-300"
        >
          ← Back to Dashboard
        </Link>

        <section className="mt-8 rounded-3xl border border-zinc-800 bg-zinc-950/80 p-8">
          <p className="mb-4 inline-flex rounded-full border border-emerald-500/30 px-4 py-2 text-sm text-emerald-400">
            Position Size Calculator
          </p>

          <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
            Trade smarter before you enter.
          </h1>

          <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-400">
            Calculate share size, buying power, capital required, max loss,
            potential profit/loss, and risk-to-reward.
          </p>
        </section>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.1fr]">
          <section className="rounded-3xl border border-zinc-800 bg-zinc-950 p-6">
            <h2 className="text-2xl font-semibold">Trade Setup</h2>

            <div className="mt-6 grid grid-cols-2 gap-3 rounded-2xl bg-black p-2">
              <button
                onClick={() => setDirection("long")}
                className={`rounded-xl py-3 font-semibold ${
                  direction === "long"
                    ? "bg-emerald-500 text-black"
                    : "text-zinc-400 hover:bg-zinc-900"
                }`}
              >
                🟢 Long
              </button>

              <button
                onClick={() => setDirection("short")}
                className={`rounded-xl py-3 font-semibold ${
                  direction === "short"
                    ? "bg-red-500 text-white"
                    : "text-zinc-400 hover:bg-zinc-900"
                }`}
              >
                🔴 Short
              </button>
            </div>

            <div className="mt-6 grid gap-5">
              <Field label="Account Size" prefix="$" value={account} setValue={setAccount} />
              <Field label="Risk Per Trade" suffix="%" value={risk} setValue={setRisk} />
              <Field label="Entry Price" prefix="$" value={entry} setValue={setEntry} />
              <Field label="Stop Loss" prefix="$" value={stop} setValue={setStop} />
              <Field label="Target Price Optional" prefix="$" value={target} setValue={setTarget} />
            </div>

            <div className="mt-6 grid grid-cols-3 gap-3">
              <Preset label="0.5%" onClick={() => setRisk("0.5")} />
              <Preset label="1%" onClick={() => setRisk("1")} />
              <Preset label="2%" onClick={() => setRisk("2")} />
            </div>

            <button
              onClick={resetCalculator}
              className="mt-6 w-full rounded-xl border border-zinc-700 py-3 font-semibold text-zinc-300 hover:bg-zinc-900"
            >
              Reset Calculator
            </button>
          </section>

          <section className="rounded-3xl border border-emerald-500/30 bg-zinc-950 p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">Results</h2>
              <span
                className={`rounded-full px-3 py-1 text-sm font-semibold ${
                  direction === "long"
                    ? "bg-emerald-500/10 text-emerald-400"
                    : "bg-red-500/10 text-red-400"
                }`}
              >
                {direction.toUpperCase()}
              </span>
            </div>

            {result.exceedsBuyingPower ? (
              <Alert
                type="danger"
                title="Position exceeds buying power"
                message={`To risk ${result.riskPercent}%, this setup needs ${result.riskBasedShares.toLocaleString()} shares and ${money(
                  result.capitalRequired
                )}. Your account can afford ${result.maxAffordableShares.toLocaleString()} shares without margin, so actual risk is ${result.actualRiskPercent.toFixed(
                  2
                )}%.`}
              />
            ) : result.nearMaxBuyingPower ? (
              <Alert
                type="warning"
                title="High buying power usage"
                message="This trade uses most of your account. Consider reducing risk or position size."
              />
            ) : (
              <Alert
                type="success"
                title="Trade fits account size"
                message="This position fits within your available buying power."
              />
            )}

            <TradeGrade grade={result.grade} rating={result.rating} rr={result.rr} />

            <RiskVisualization
              direction={direction}
              entry={result.entryPrice}
              stop={result.stopPrice}
              target={result.targetPrice}
              validTarget={result.validTarget}
            />

            <div className="mt-6 rounded-3xl border border-zinc-800 bg-black p-6">
              <div className="flex items-center justify-between">
                <p className="text-sm text-zinc-400">Trade Summary</p>
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400">
                  {result.exceedsBuyingPower ? "ADJUSTED" : "VALID"}
                </span>
              </div>

              <div className="mt-6">
                <p className="text-sm text-zinc-500">Shares to Buy</p>
                <p className="mt-2 text-6xl font-bold text-emerald-400">
                  {result.sharesToBuy.toLocaleString()}
                </p>
              </div>

              <div className="mt-6 grid gap-3">
                <SummaryRow label="Capital Used" value={money(result.capitalUsed)} />
                <SummaryRow label="Maximum Loss" value={money(result.actualRisk)} />
                <SummaryRow label="Actual Risk %" value={`${result.actualRiskPercent.toFixed(2)}%`} />
                <SummaryRow
                  label="Potential Profit/Loss"
                  value={money(result.potentialProfitLoss)}
                  negative={result.potentialProfitLoss < 0}
                  positive={result.potentialProfitLoss > 0}
                />
                <SummaryRow label="Risk / Reward" value={result.rr ? `${result.rr.toFixed(2)}R` : "—"} />
                <SummaryRow label="Buying Power" value={`${result.buyingPowerUsed.toFixed(1)}%`} />
              </div>

              <button
                onClick={copySetup}
                className="mt-6 w-full rounded-xl bg-emerald-500 py-3 font-bold text-black hover:bg-emerald-400"
              >
                {copied ? "Copied!" : "Copy Trade Setup"}
              </button>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Result label="Risk-Based Shares" value={result.riskBasedShares.toLocaleString()} />
              <Result label="Capital Required" value={money(result.capitalRequired)} />
              <Result label="Max Affordable Shares" value={result.maxAffordableShares.toLocaleString()} />
              <Result label="Dollar Risk Goal" value={money(result.dollarRiskGoal)} />
              <Result label="Risk Per Share" value={money(result.riskPerShare)} />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

function Field({
  label,
  prefix,
  suffix,
  value,
  setValue,
}: {
  label: string;
  prefix?: string;
  suffix?: string;
  value: string;
  setValue: (value: string) => void;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-medium text-zinc-300">{label}</span>
      <div className="flex items-center rounded-xl border border-zinc-800 bg-black px-4 focus-within:border-emerald-400">
        {prefix && <span className="text-zinc-500">{prefix}</span>}
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          type="number"
          className="w-full bg-transparent px-3 py-4 text-white outline-none"
          placeholder="0"
        />
        {suffix && <span className="text-zinc-500">{suffix}</span>}
      </div>
    </label>
  );
}

function Preset({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-xl border border-zinc-800 bg-black py-3 text-sm font-semibold text-zinc-300 hover:border-emerald-400"
    >
      {label}
    </button>
  );
}

function Alert({
  type,
  title,
  message,
}: {
  type: "success" | "warning" | "danger";
  title: string;
  message: string;
}) {
  const styles = {
    success: "border-emerald-500/30 bg-emerald-500/10 text-emerald-300",
    warning: "border-yellow-500/30 bg-yellow-500/10 text-yellow-300",
    danger: "border-red-500/30 bg-red-500/10 text-red-300",
  };

  return (
    <div className={`mt-6 rounded-2xl border p-4 ${styles[type]}`}>
      <p className="font-bold">{title}</p>
      <p className="mt-1 text-sm opacity-90">{message}</p>
    </div>
  );
}

function TradeGrade({ grade, rating, rr }: { grade: string; rating: string; rr: number }) {
  return (
    <div className="mt-4 rounded-2xl border border-zinc-800 bg-black p-5">
      <p className="text-sm text-zinc-500">Trade Rating</p>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-2xl font-bold text-white">{rating}</p>
        <p className="rounded-xl bg-emerald-500 px-4 py-2 text-2xl font-black text-black">
          {grade}
        </p>
      </div>
      <p className="mt-2 text-sm text-zinc-400">
        {rr > 0 ? `Risk/reward is ${rr.toFixed(2)}R.` : "Add a valid target to calculate risk/reward."}
      </p>
    </div>
  );
}

function RiskVisualization({
  direction,
  entry,
  stop,
  target,
  validTarget,
}: {
  direction: Direction;
  entry: number;
  stop: number;
  target: number;
  validTarget: boolean;
}) {
  const hasValues = entry > 0 && stop > 0 && target > 0;

  if (!hasValues) {
    return (
      <div className="mt-4 rounded-2xl border border-zinc-800 bg-black p-5 text-sm text-zinc-500">
        Enter entry, stop, and target to see the risk visualization.
      </div>
    );
  }

  const risk = Math.abs(entry - stop);
  const reward = validTarget ? Math.abs(target - entry) : 0;
  const total = risk + reward || 1;

  const riskWidth = Math.max(8, Math.min((risk / total) * 100, 100));
  const rewardWidth = validTarget ? Math.max(8, Math.min((reward / total) * 100, 100)) : 0;

  return (
    <div className="mt-4 rounded-2xl border border-zinc-800 bg-black p-5">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-semibold text-white">Risk Visualization</p>
        <p className="text-xs text-zinc-500">{direction.toUpperCase()}</p>
      </div>

      <div className="flex h-4 overflow-hidden rounded-full bg-zinc-800">
        <div className="bg-red-500" style={{ width: `${riskWidth}%` }} />
        <div className="bg-emerald-500" style={{ width: `${rewardWidth}%` }} />
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-xs">
        <PriceMarker label="Stop" value={stop} color="text-red-400" />
        <PriceMarker label="Entry" value={entry} color="text-white" />
        <PriceMarker label="Target" value={target} color={validTarget ? "text-emerald-400" : "text-red-400"} />
      </div>

      {!validTarget && (
        <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-300">
          Invalid target: for a {direction} trade, the target is on the wrong side of entry.
        </p>
      )}
    </div>
  );
}

function PriceMarker({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div>
      <p className="text-zinc-500">{label}</p>
      <p className={`font-bold ${color}`}>{money(value)}</p>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  negative,
  positive,
}: {
  label: string;
  value: string;
  negative?: boolean;
  positive?: boolean;
}) {
  return (
    <div className="flex items-center justify-between border-t border-zinc-800 py-3">
      <span className="text-sm text-zinc-500">{label}</span>
      <span className={`font-bold ${negative ? "text-red-400" : positive ? "text-emerald-400" : "text-white"}`}>
        {value}
      </span>
    </div>
  );
}

function Result({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-black p-4">
      <p className="text-sm text-zinc-500">{label}</p>
      <p className="mt-1 text-lg font-bold text-white">{value}</p>
    </div>
  );
}

function money(value: number) {
  return `$${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}