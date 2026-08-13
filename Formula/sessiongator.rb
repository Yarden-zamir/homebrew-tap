# typed: false
# frozen_string_literal: true

class Sessiongator < Formula
  desc "Rust TUI browser for AI coding sessions"
  homepage "https://github.com/Yarden-zamir/sessiongator"
  url "https://github.com/Yarden-zamir/sessiongator/archive/refs/tags/v0.4.1.tar.gz"
  sha256 "1a7887c8cb27231b24c0208b8d84ccd6cee82463fc7cc34521029360c3cd5f5c"
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
