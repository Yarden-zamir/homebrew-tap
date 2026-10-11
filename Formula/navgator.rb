# typed: false
# frozen_string_literal: true

class Navgator < Formula
  desc "Rust TUI project navigator with Git worktree and preview support"
  homepage "https://github.com/Yarden-zamir/navgator"
  url "https://github.com/Yarden-zamir/navgator/archive/refs/tags/v0.7.0.tar.gz"
  sha256 "73a71658577855085a2455b0a7e4ee449f2aad85cc76bf2bb5226f791fcc9baf"
  license "MIT"
  head "https://github.com/Yarden-zamir/navgator.git", branch: "main"

  depends_on "rust" => :build
  depends_on "erdtree"
  depends_on "gh"

  def install
    system "cargo", "install", *std_cargo_args
    pkgshare.install "scripts/navgator.zsh"
  end

  def caveats
    <<~EOS
      Run `navgator onboarding` for a guided setup, or add this to your .zshrc:
        source #{opt_pkgshare}/navgator.zsh
        bindkey '^T' navigate

      navgator needs a Nerd Font to render its icons, for example:
        brew install --cask font-jetbrains-mono-nerd-font
    EOS
  end

  test do
    assert_match "Usage:", shell_output("#{bin}/navgator --help 2>&1")
  end
end
