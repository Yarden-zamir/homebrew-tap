# typed: false
# frozen_string_literal: true

class Sessiongator < Formula
  desc "Rust TUI browser for AI coding sessions"
  homepage "https://github.com/Yarden-zamir/sessiongator"
  url "https://github.com/Yarden-zamir/sessiongator/archive/refs/tags/v0.5.1.tar.gz"
  sha256 "94aaef65e5ce6c61ef830dfacc5c47d3b45e1006e91b5cb5fe41e76be900e05a"
  license "MIT"
  head "https://github.com/Yarden-zamir/sessiongator.git", branch: "main"

  depends_on "rust" => :build

  def install
    system "cargo", "install", *std_cargo_args
    pkgshare.install "scripts/sessiongator.zsh"
  end

  def caveats
    <<~EOS
      To activate the zsh session widget, add this to your .zshrc:
        source #{opt_pkgshare}/sessiongator.zsh

      Then bind it, for example:
        bindkey '^S' ai-sessions
    EOS
  end

  test do
    system "#{bin}/sessiongator", "--list"
  end
end
