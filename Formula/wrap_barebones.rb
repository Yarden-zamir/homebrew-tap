class Wrap < Formula
  desc "Generates 'wraps' for functions in any language using 'processors'"
  homepage "https://github.com/Yarden-zamir/wrap"
  url "https://github.com/Yarden-zamir/WRAP/archive/refs/tags/0.2.0.tar.gz"
  sha256 "337bbaad08f944c48f0c517de709074e302e370300f8075cd4502de1595d9275"
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
