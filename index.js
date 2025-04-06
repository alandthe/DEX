// CatSwap DEX Frontend (React + Tailwind + ethers.js)
// Enhanced: Live pricing, balance checks, LP info, loading feedback

import { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const WC_ADDRESS = "0xDD175A3998D81C3Ef51aBB9c1Eab2D7a8C795F68";
const SONIC_ADDRESS = "0xfc00000000000000000000000000000000000000";
const CATSWAP_CONTRACT = "0x7c2dbfc3b50605b5c498fec331f4b4f77d2b9822";

const ABI = [
  "function swapWcToSonic(uint256 wcAmount) external",
  "function swapSonicToWc(uint256 sonicAmount) external",
  "function getPrice(uint256 inputAmount, bool isWcToSonic) public view returns (uint256)",
  "function addLiquidity(uint256 wcAmount, uint256 sonicAmount) external",
  "function removeLiquidity(uint256 lpAmount) external",
  "function balanceOf(address owner) external view returns (uint256)"
];

const ERC20_ABI = [
  "function approve(address,uint256) public returns (bool)",
  "function balanceOf(address) view returns (uint256)",
  "function decimals() view returns (uint8)"
];

export default function CatSwap() {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState(null);
  const [wcAmount, setWcAmount] = useState("");
  const [sonicAmount, setSonicAmount] = useState("");
  const [isWcToSonic, setIsWcToSonic] = useState(true);
  const [lpAmount, setLpAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [wcBalance, setWcBalance] = useState("0");
  const [sonicBalance, setSonicBalance] = useState("0");
  const [lpBalance, setLpBalance] = useState("0");

  const connectWallet = async () => {
    if (window.ethereum) {
      const prov = new ethers.providers.Web3Provider(window.ethereum);
      await window.ethereum.request({ method: "eth_requestAccounts" });
      const signer = prov.getSigner();
      const addr = await signer.getAddress();
      setProvider(prov);
      setSigner(signer);
      setAccount(addr);
    }
  };

  useEffect(() => {
    if (!signer || !account) return;
    const loadBalances = async () => {
      const wc = new ethers.Contract(WC_ADDRESS, ERC20_ABI, provider);
      const sonic = new ethers.Contract(SONIC_ADDRESS, ERC20_ABI, provider);
      const lp = new ethers.Contract(CATSWAP_CONTRACT, ABI, provider);
      const [wcBal, sonicBal, lpBal] = await Promise.all([
        wc.balanceOf(account),
        sonic.balanceOf(account),
        lp.balanceOf(account)
      ]);
      setWcBalance(ethers.utils.formatUnits(wcBal, 18));
      setSonicBalance(ethers.utils.formatUnits(sonicBal, 18));
      setLpBalance(ethers.utils.formatUnits(lpBal, 18));
    };
    loadBalances();
  }, [signer, account, loading]);

  const getEstimatedOutput = async (amount) => {
    if (!signer || !amount) return;
    try {
      const contract = new ethers.Contract(CATSWAP_CONTRACT, ABI, provider);
      const parsed = ethers.utils.parseUnits(amount, 18);
      const output = await contract.getPrice(parsed, isWcToSonic);
      return ethers.utils.formatUnits(output, 18);
    } catch {
      return "0";
    }
  };

  useEffect(() => {
    (async () => {
      const amt = isWcToSonic ? wcAmount : sonicAmount;
      const output = await getEstimatedOutput(amt);
      isWcToSonic ? setSonicAmount(output) : setWcAmount(output);
    })();
  }, [wcAmount, sonicAmount, isWcToSonic]);

  const handleSwap = async () => {
    if (!signer) return;
    setLoading(true);
    try {
      const contract = new ethers.Contract(CATSWAP_CONTRACT, ABI, signer);
      const amount = isWcToSonic ? wcAmount : sonicAmount;
      const parsedAmount = ethers.utils.parseUnits(amount, 18);

      if (isWcToSonic) {
        const wc = new ethers.Contract(WC_ADDRESS, ERC20_ABI, signer);
        await wc.approve(CATSWAP_CONTRACT, parsedAmount);
        const tx = await contract.swapWcToSonic(parsedAmount);
        await tx.wait();
      } else {
        const sonic = new ethers.Contract(SONIC_ADDRESS, ERC20_ABI, signer);
        await sonic.approve(CATSWAP_CONTRACT, parsedAmount);
        const tx = await contract.swapSonicToWc(parsedAmount);
        await tx.wait();
      }

      alert("Swap successful!");
    } catch (err) {
      console.error(err);
      alert("Swap failed: " + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-purple-950 text-white flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-2">🐱 CatSwap</h1>
      <p className="mb-6 text-purple-300">Swap WAGMI Cat (WC) and Sonic</p>

      {!account ? (
        <Button onClick={connectWallet} className="bg-purple-700 hover:bg-purple-600">
          Connect Wallet
        </Button>
      ) : (
        <div className="w-full max-w-md bg-purple-800 p-6 rounded-2xl shadow-xl">
          <p className="mb-4 text-sm">Connected: {account}</p>
          <p className="mb-2 text-xs text-purple-300">Your WC: {parseFloat(wcBalance).toFixed(4)} | Sonic: {parseFloat(sonicBalance).toFixed(4)} | LP: {parseFloat(lpBalance).toFixed(4)}</p>

          {/* Token Input */}
          <div className="mb-4">
            <label className="block mb-2 text-sm">From:</label>
            <div className="flex items-center space-x-2">
              {isWcToSonic ? (
                <>
                  <img src="/0xDD175A3998D81C3Ef51aBB9c1Eab2D7a8C795F68.png" alt="WC Icon" className="w-8 h-8 rounded-full" />
                  <span>WC</span>
                </>
              ) : (
                <>
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black font-bold">S</div>
                  <span>Sonic</span>
                </>
              )}
              <Input
                type="number"
                value={isWcToSonic ? wcAmount : sonicAmount}
                onChange={(e) => isWcToSonic ? setWcAmount(e.target.value) : setSonicAmount(e.target.value)}
                className="bg-purple-900 border-purple-700 text-right"
              />
            </div>
          </div>

          {/* Token Output */}
          <div className="mb-4">
            <label className="block mb-2 text-sm">To:</label>
            <div className="flex items-center space-x-2">
              {isWcToSonic ? (
                <>
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-black font-bold">S</div>
                  <span>Sonic</span>
                </>
              ) : (
                <>
                  <img src="/0xDD175A3998D81C3Ef51aBB9c1Eab2D7a8C795F68.png" alt="WC Icon" className="w-8 h-8 rounded-full" />
                  <span>WC</span>
                </>
              )}
              <Input
                type="number"
                value={isWcToSonic ? sonicAmount : wcAmount}
                readOnly
                className="bg-purple-900 border-purple-700 text-right"
              />
            </div>
          </div>

          <div className="flex justify-between mb-4">
            <Button
              onClick={() => setIsWcToSonic(!isWcToSonic)}
              className="text-sm bg-purple-600 hover:bg-purple-500"
            >
              🔁 Switch Direction
            </Button>
          </div>

          <Button
            onClick={handleSwap}
            className="w-full mt-4 bg-pink-600 hover:bg-pink-500"
            disabled={loading}
          >
            {loading ? "Swapping..." : "Swap"}
          </Button>

          {/* Add Liquidity */}
          <div className="mt-8 p-4 border-t border-purple-600">
            <h2 className="mb-2 font-semibold">Add Liquidity</h2>
            <div className="flex flex-col space-y-2">
              <Input
                placeholder="WC Amount"
                type="number"
                value={wcAmount}
                onChange={(e) => setWcAmount(e.target.value)}
                className="bg-purple-900 border-purple-700"
              />
              <Input
                placeholder="Sonic Amount"
                type="number"
                value={sonicAmount}
                onChange={(e) => setSonicAmount(e.target.value)}
                className="bg-purple-900 border-purple-700"
              />
              <Button
                onClick={async () => {
                  if (!signer) return;
                  setLoading(true);
                  try {
                    const wc = new ethers.Contract(WC_ADDRESS, ERC20_ABI, signer);
                    const sonic = new ethers.Contract(SONIC_ADDRESS, ERC20_ABI, signer);
                    const contract = new ethers.Contract(CATSWAP_CONTRACT, ABI, signer);

                    const wcAmt = ethers.utils.parseUnits(wcAmount, 18);
                    const sonicAmt = ethers.utils.parseUnits(sonicAmount, 18);

                    await wc.approve(CATSWAP_CONTRACT, wcAmt);
                    await sonic.approve(CATSWAP_CONTRACT, sonicAmt);

                    const tx = await contract.addLiquidity(wcAmt, sonicAmt);
                    await tx.wait();

                    alert("Liquidity added!");
                  } catch (err) {
                    console.error(err);
                    alert("Add liquidity failed: " + err.message);
                  }
                  setLoading(false);
                }}
                className="bg-blue-600 hover:bg-blue-500"
              >
                Add Liquidity
              </Button>
            </div>
          </div>

          {/* Remove Liquidity */}
          <div className="mt-6 p-4 border-t border-purple-600">
            <h2 className="mb-2 font-semibold">Remove Liquidity</h2>
            <Input
              placeholder="LP Amount to Remove"
              type="number"
              value={lpAmount}
              onChange={(e) => setLpAmount(e.target.value)}
              className="bg-purple-900 border-purple-700"
            />
            <Button
              onClick={async () => {
                if (!signer) return;
                setLoading(true);
                try {
                  const contract = new ethers.Contract(CATSWAP_CONTRACT, ABI, signer);
                  const parsed = ethers.utils.parseUnits(lpAmount, 18);
                  const tx = await contract.removeLiquidity(parsed);
                  await tx.wait();
                  alert("Liquidity removed!");
                } catch (err) {
                  console.error(err);
                  alert("Remove liquidity failed: " + err.message);
                }
                setLoading(false);
              }}
              className="bg-red-600 hover:bg-red-500 mt-2"
              disabled={loading}
            >
              {loading ? "Removing..." : "Remove Liquidity"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
