# typed: false
# frozen_string_literal: true

class Sessiongator < Formula
  desc "Rust TUI browser for AI coding sessions"
  homepage "https://github.com/Yarden-zamir/sessiongator"
  url "https://github.com/Yarden-zamir/sessiongator/archive/refs/tags/v0.4.0.tar.gz"
  sha256 "2c297d6ac3f257691bf54cac861e7b011ae6bbba9f0602a82d20f379478ae376"
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
