class Wrap < Formula
  desc "Generates 'wraps' for functions in any language using 'processors'"
  homepage "https://github.com/Yarden-zamir/wrap"
  url "https://github.com/Yarden-zamir/WRAP/archive/refs/tags/0.1.0.tar.gz"
  sha256 "c55de042163e6dcb8936f890a7bdd2432fbcfdb238639f30fd2748c1008eaed5"
  license ""
  depends_on "python@3.10"
  def install
    # system "./configure", *std_configure_args, "--disable-silent-rules"
    bin.install "wrap"
  end
  test do
    system bin/"wrap", "--help"
  end
end
