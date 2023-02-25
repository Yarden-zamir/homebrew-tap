class Wrap < Formula
  desc "Generates 'wraps' for functions in any language using 'processors'"
  homepage "https://github.com/Yarden-zamir/wrap"
  url "https://github.com/Yarden-zamir/homebrew-wrap/archive/refs/tags/0.1.0.tar.gz"
  sha256 "04a912d65cc8aecf8a7b542ec506e4aaf25a2b466e5d3aed21e00066ef045cbe"
  license ""
  depends_on "python@3.10"
  def install
    system "./configure", *std_configure_args, "--disable-silent-rules"
  end
  test do
    system bin/"wrap", "--help"
  end
end
