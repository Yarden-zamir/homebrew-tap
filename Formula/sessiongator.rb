# typed: false
# frozen_string_literal: true

class Sessiongator < Formula
  desc "Rust TUI browser for Claude Code and opencode sessions"
  homepage "https://github.com/Yarden-zamir/sessiongator"
  url "https://github.com/Yarden-zamir/sessiongator/archive/refs/tags/v0.1.0.tar.gz"
  sha256 "671d5143dff01fda67b6ddd354bc392f42d2a1484154ea88d8f85db4019ae8cd"
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
