# typed: false
# frozen_string_literal: true

class Navgator < Formula
  desc "Rust TUI tools for project navigation and GitHub issue exploration"
  homepage "https://github.com/Yarden-zamir/Navgator"
  url "https://github.com/Yarden-zamir/Navgator/archive/refs/tags/v0.1.1.tar.gz"
  sha256 "74bda754d98b66a96f5c7c71a5da417e0f8723d0cf0d3db383f712cefcb63fe1"
  license "MIT"
  head "https://github.com/Yarden-zamir/Navgator.git", branch: "main"

  depends_on "rust" => :build
  depends_on "erdtree"
  depends_on "gh"

  def install
    system "cargo", "install", *std_cargo_args(path: "crates/navgator-navigate")
    system "cargo", "install", *std_cargo_args(path: "crates/navgator-issues")
    bin.install_symlink "navgator-navigate" => "navgator"
    pkgshare.install "scripts/navgator.zsh"
  end

  def caveats
    <<~EOS
      To activate the zsh navigator widget, add this to your .zshrc:
        source #{opt_pkgshare}/navgator.zsh

      Then bind it, for example:
        bindkey '^T' navigate
    EOS
  end

  test do
    assert_match "Usage:", shell_output("#{bin}/navgator-navigate --help 2>&1")
  end
end
